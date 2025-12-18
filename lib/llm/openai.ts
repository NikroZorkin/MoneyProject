/**
 * OpenAI LLM service for transaction analysis
 * 
 * Rules (from project guidelines):
 * - LLM calls happen server-side only
 * - Always request strict JSON output
 * - Store: prompt version, model name, raw response, parsed JSON, validation errors
 * - Add confidence per transaction
 * - Never trust LLM for totals
 */

import { z } from 'zod';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'gpt-4o-mini';
const PROMPT_VERSION = '1.0.0';

// Zod schema for LLM response validation
const TransactionAnalysisSchema = z.object({
  transactions: z.array(z.object({
    index: z.number(),
    suggestedCategory: z.string(),
    merchantNormalized: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

export type TransactionAnalysis = z.infer<typeof TransactionAnalysisSchema>;

interface TransactionForAnalysis {
  index: number;
  description: string;
  amount: number;
  currency: string;
  date: string;
}

interface LLMResult {
  success: boolean;
  data?: TransactionAnalysis;
  rawResponse?: string;
  error?: string;
  model: string;
  promptVersion: string;
}

/**
 * Analyze transactions using OpenAI
 */
export async function analyzeTransactions(
  transactions: TransactionForAnalysis[],
  availableCategories: string[]
): Promise<LLMResult> {
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
      model: MODEL,
      promptVersion: PROMPT_VERSION,
    };
  }

  // Chunk transactions to avoid token limits (max ~50 per request)
  const CHUNK_SIZE = 50;
  const chunks = [];
  for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
    chunks.push(transactions.slice(i, i + CHUNK_SIZE));
  }

  const allResults: TransactionAnalysis['transactions'] = [];

  for (const chunk of chunks) {
    const result = await analyzeChunk(chunk, availableCategories);
    if (!result.success || !result.data) {
      return result;
    }
    allResults.push(...result.data.transactions);
  }

  return {
    success: true,
    data: { transactions: allResults },
    model: MODEL,
    promptVersion: PROMPT_VERSION,
  };
}

async function analyzeChunk(
  transactions: TransactionForAnalysis[],
  availableCategories: string[]
): Promise<LLMResult> {
  const systemPrompt = `You are a financial transaction analyzer. Your task is to:
1. Categorize each transaction into one of the provided categories
2. Normalize merchant names (extract clean business name from raw description)
3. Provide a confidence score (0-1) for your categorization

Available categories: ${availableCategories.join(', ')}

Rules:
- Always return valid JSON matching the schema
- Use "uncategorized" if you cannot determine the category
- Confidence should reflect your certainty (0.9+ for obvious matches, 0.5-0.7 for guesses)
- For merchant normalization, extract the business name (e.g., "AMAZON.DE*123ABC" → "Amazon")
- Never include transaction amounts or totals in your response
- Respond ONLY with JSON, no explanations`;

  const userPrompt = `Analyze these transactions and return JSON:

${JSON.stringify(transactions, null, 2)}

Return JSON in this exact format:
{
  "transactions": [
    {
      "index": <transaction index>,
      "suggestedCategory": "<category from the list>",
      "merchantNormalized": "<clean merchant name>",
      "confidence": <0.0 to 1.0>
    }
  ]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for consistent results
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return {
        success: false,
        error: `OpenAI API error: ${response.status}`,
        rawResponse: errorText,
        model: MODEL,
        promptVersion: PROMPT_VERSION,
      };
    }

    const data = await response.json();
    const rawResponse = data.choices?.[0]?.message?.content;

    if (!rawResponse) {
      return {
        success: false,
        error: 'Empty response from OpenAI',
        model: MODEL,
        promptVersion: PROMPT_VERSION,
      };
    }

    // Parse and validate JSON response
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawResponse);
    } catch {
      return {
        success: false,
        error: 'Invalid JSON in LLM response',
        rawResponse,
        model: MODEL,
        promptVersion: PROMPT_VERSION,
      };
    }

    // Validate with Zod
    const validationResult = TransactionAnalysisSchema.safeParse(parsedJson);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: `Validation error: ${validationResult.error.message}`,
        rawResponse,
        model: MODEL,
        promptVersion: PROMPT_VERSION,
      };
    }

    return {
      success: true,
      data: validationResult.data,
      rawResponse,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
    };
  } catch (error) {
    console.error('OpenAI request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model: MODEL,
      promptVersion: PROMPT_VERSION,
    };
  }
}

/**
 * Simple categorization without LLM (fallback)
 */
export function categorizeByKeywords(description: string): {
  category: string;
  confidence: number;
} {
  const desc = description.toLowerCase();
  
  const rules: Array<{ keywords: string[]; category: string }> = [
    { keywords: ['rewe', 'edeka', 'lidl', 'aldi', 'penny', 'netto', 'kaufland', 'supermarkt', 'lebensmittel'], category: 'food_groceries' },
    { keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'burger', 'pizza', 'sushi', 'lieferando', 'uber eats'], category: 'food_dining' },
    { keywords: ['db ', 'bahn', 'ticket', 'uber', 'taxi', 'bolt', 'lime', 'tier', 'flixbus'], category: 'transport_public' },
    { keywords: ['tankstelle', 'shell', 'aral', 'esso', 'total', 'benzin', 'diesel', 'parking'], category: 'transport_car' },
    { keywords: ['miete', 'rent', 'wohnung'], category: 'utilities_rent' },
    { keywords: ['strom', 'gas', 'electricity', 'vattenfall', 'eon', 'stadtwerke'], category: 'utilities_electricity' },
    { keywords: ['netflix', 'spotify', 'disney', 'amazon prime', 'youtube', 'kino', 'cinema', 'theater'], category: 'entertainment_movies' },
    { keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'game'], category: 'entertainment_games' },
    { keywords: ['apotheke', 'arzt', 'doctor', 'pharmacy', 'krankenhaus', 'hospital', 'zahnarzt'], category: 'healthcare_doctor' },
    { keywords: ['amazon', 'zalando', 'h&m', 'zara', 'mediamarkt', 'saturn', 'ikea', 'kleidung', 'clothes'], category: 'shopping_clothes' },
    { keywords: ['gehalt', 'salary', 'lohn', 'wage', 'einzahlung', 'gutschrift'], category: 'income_salary' },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(kw => desc.includes(kw))) {
      return { category: rule.category, confidence: 0.7 };
    }
  }

  return { category: 'uncategorized', confidence: 0.3 };
}


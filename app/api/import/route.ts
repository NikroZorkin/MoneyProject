import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateFileHash, calculateTextHash, findExistingImport, createImport } from '@/lib/import';
import { ImportStatus } from '@prisma/client';
import { parseCsvCommerzbank, parsePdfCommerzbank } from '@/lib/parsers/commerzbank';
import { convertAmount } from '@/lib/fx';
import { analyzeTransactions, categorizeByKeywords } from '@/lib/llm/openai';

export const maxDuration = 120; // 120 seconds for AI analysis
export const maxFileSize = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const reportCurrency = (formData.get('reportCurrency') as string) || 'EUR';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Calculate hash for deduplication
    const fileHash = calculateFileHash(buffer);

    // Check if already imported
    const existingImportId = await findExistingImport(fileHash);
    if (existingImportId) {
      return NextResponse.json(
        { error: 'This file has already been imported', importId: existingImportId },
        { status: 409 }
      );
    }

    // Determine file type
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isPdf = fileName.endsWith('.pdf');

    if (!isCsv && !isPdf) {
      return NextResponse.json({ error: 'Invalid file type. Only CSV and PDF are supported' }, { status: 400 });
    }

    // Extract and parse
    let transactions: Array<{
      bookingDate: Date;
      valutaDate: Date;
      accountAmountCents: number;
      accountCurrency: string;
      descriptionRaw: string;
      sourceRef: string;
      txnExternalId?: string;
    }> = [];
    let extractedText = '';

    if (isCsv) {
      const text = buffer.toString('utf-8');
      extractedText = text;
      transactions = await parseCsvCommerzbank(text);
    } else {
      // PDF parsing
      const pdfResult = await parsePdfCommerzbank(buffer);
      extractedText = pdfResult.text;
      transactions = pdfResult.transactions;
    }

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions found in file' }, { status: 400 });
    }

    // Get available categories for AI analysis
    const categories = await prisma.category.findMany({
      select: { id: true, key: true },
    });
    const categoryKeys = categories.map(c => c.key);
    const categoryMap = new Map(categories.map(c => [c.key, c.id]));

    // Prepare transactions for AI analysis
    const transactionsForAnalysis = transactions.map((tx, index) => ({
      index,
      description: tx.descriptionRaw,
      amount: tx.accountAmountCents / 100,
      currency: tx.accountCurrency,
      date: tx.bookingDate.toISOString().split('T')[0],
    }));

    // Run AI analysis
    let aiAnalysis: Map<number, { categoryId: string | null; merchantNormalized: string; confidence: number }> = new Map();
    
    const llmResult = await analyzeTransactions(transactionsForAnalysis, categoryKeys);
    
    if (llmResult.success && llmResult.data) {
      // Map AI results
      for (const result of llmResult.data.transactions) {
        const categoryId = categoryMap.get(result.suggestedCategory) || null;
        aiAnalysis.set(result.index, {
          categoryId,
          merchantNormalized: result.merchantNormalized,
          confidence: result.confidence,
        });
      }
      console.log(`AI analysis completed: ${llmResult.data.transactions.length} transactions analyzed`);
    } else {
      // Fallback to keyword-based categorization
      console.warn('AI analysis failed, using keyword fallback:', llmResult.error);
      for (let i = 0; i < transactions.length; i++) {
        const { category, confidence } = categorizeByKeywords(transactions[i].descriptionRaw);
        const categoryId = categoryMap.get(category) || null;
        aiAnalysis.set(i, {
          categoryId,
          merchantNormalized: transactions[i].descriptionRaw.substring(0, 100),
          confidence,
        });
      }
    }

    // Calculate extracted text hash
    const extractedTextHash = calculateTextHash(extractedText);

    // Check for duplicate by extracted text hash
    const existingByText = await prisma.import.findUnique({
      where: { extractedTextHash: extractedTextHash },
      select: { id: true },
    });

    if (existingByText) {
      return NextResponse.json(
        { error: 'This file content has already been imported', importId: existingByText.id },
        { status: 409 }
      );
    }

    // Determine statement date range
    const dates = transactions.map(t => t.bookingDate).sort((a, b) => a.getTime() - b.getTime());
    const statementFrom = dates[0];
    const statementTo = dates[dates.length - 1];

    // Create import record
    const importRecord = await createImport(
      fileHash,
      extractedTextHash,
      statementFrom,
      statementTo
    );

    // Convert transactions and create draft records
    const draftTransactions = await Promise.all(
      transactions.map(async (tx, index) => {
        // Convert amount if needed
        let convertedAmountCents = tx.accountAmountCents;
        let fxRateUsed = null;
        let fxDateUsed = null;
        let fxDateSource = null;

        if (tx.accountCurrency !== reportCurrency) {
          const conversion = await convertAmount(
            tx.accountAmountCents,
            tx.accountCurrency,
            reportCurrency,
            tx.valutaDate,
            tx.bookingDate
          );

          if (conversion) {
            convertedAmountCents = conversion.convertedAmountCents;
            fxRateUsed = conversion.fxRateUsed;
            fxDateUsed = conversion.fxDateUsed;
            fxDateSource = conversion.fxDateSource;
          }
        }

        return {
          bookingDate: tx.bookingDate,
          valutaDate: tx.valutaDate,
          accountAmountCents: tx.accountAmountCents,
          accountCurrency: tx.accountCurrency,
          reportCurrency,
          convertedAmountCents,
          fxRateUsed,
          fxDateUsed,
          fxDateSource,
          descriptionRaw: tx.descriptionRaw,
          importId: importRecord.id,
          sourceRef: tx.sourceRef,
          txnExternalId: tx.txnExternalId,
          isReviewed: false,
        };
      })
    );

    // Create transactions in batch
    await prisma.transaction.createMany({
      data: draftTransactions,
    });

    // Update import status
    await prisma.import.update({
      where: { id: importRecord.id },
      data: { status: ImportStatus.COMPLETED },
    });

    return NextResponse.json({
      importId: importRecord.id,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}

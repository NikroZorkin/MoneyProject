import { z } from 'zod';
import { parseMoney } from '../money';

/**
 * Draft transaction parsed from CSV row
 */
export interface DraftTransaction {
  bookingDate: Date;
  valutaDate: Date;
  accountAmountCents: number;
  accountCurrency: string;
  descriptionRaw: string;
  txnExternalId?: string;
  rowIndex: number;
}

/**
 * Commerzbank CSV row schema
 * Typical columns: Buchungstag, Valutadatum, Betrag, Währung, Buchungstext, etc.
 */
const CommerzbankRowSchema = z.object({
  // Date formats: DD.MM.YYYY or YYYY-MM-DD
  Buchungstag: z.string().optional(),
  Valutadatum: z.string().optional(),
  Betrag: z.string(), // Amount with comma as decimal separator
  Währung: z.string().default('EUR'),
  Buchungstext: z.string(),
  Verwendungszweck: z.string().optional(),
  Empfänger: z.string().optional(),
  // Transaction ID if available
  'Transaktions-ID': z.string().optional(),
  'Umsatz-ID': z.string().optional(),
}).passthrough(); // Allow extra columns

/**
 * Parse date from German format (DD.MM.YYYY) or ISO (YYYY-MM-DD)
 */
function parseDate(dateStr: string): Date {
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try German format DD.MM.YYYY
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  throw new Error(`Invalid date format: ${dateStr}`);
}

/**
 * Parse amount from German format (e.g., "123,45" or "-123,45")
 * Commerzbank uses comma as decimal separator
 */
function parseAmount(amountStr: string): number {
  // Remove thousand separators (spaces or dots)
  let cleaned = amountStr.replace(/\s/g, '').replace(/\./g, '');
  
  // Replace comma with dot for decimal separator
  cleaned = cleaned.replace(',', '.');
  
  // Parse and convert to cents
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) {
    throw new Error(`Invalid amount format: ${amountStr}`);
  }
  
  return Math.round(parsed * 100);
}

/**
 * Combine description fields into single raw description
 */
function combineDescription(row: z.infer<typeof CommerzbankRowSchema>): string {
  const parts: string[] = [];
  
  if (row.Buchungstext) {
    parts.push(row.Buchungstext);
  }
  
  if (row.Verwendungszweck) {
    parts.push(row.Verwendungszweck);
  }
  
  if (row.Empfänger) {
    parts.push(row.Empfänger);
  }
  
  return parts.join(' | ').trim() || 'Unknown transaction';
}

/**
 * Parse a single CSV row into a draft transaction
 */
export function parseCommerzbankRow(
  row: Record<string, string>,
  rowIndex: number
): DraftTransaction {
  // Validate row structure
  const validated = CommerzbankRowSchema.parse(row);

  // Parse dates
  const bookingDateStr = validated.Buchungstag || validated.Valutadatum;
  if (!bookingDateStr) {
    throw new Error(`Row ${rowIndex}: Missing booking date`);
  }
  const bookingDate = parseDate(bookingDateStr);

  const valutaDateStr = validated.Valutadatum || validated.Buchungstag;
  if (!valutaDateStr) {
    throw new Error(`Row ${rowIndex}: Missing valuta date`);
  }
  const valutaDate = parseDate(valutaDateStr);

  // Parse amount
  const accountAmountCents = parseAmount(validated.Betrag);

  // Get currency (default to EUR)
  const accountCurrency = validated.Währung?.toUpperCase() || 'EUR';

  // Combine description
  const descriptionRaw = combineDescription(validated);

  // Get external transaction ID if available
  const txnExternalId = validated['Transaktions-ID'] || validated['Umsatz-ID'] || undefined;

  return {
    bookingDate,
    valutaDate,
    accountAmountCents,
    accountCurrency,
    descriptionRaw,
    txnExternalId,
    rowIndex,
  };
}

/**
 * Parse CSV text into array of draft transactions
 */
export function parseCommerzbankCsv(csvText: string): DraftTransaction[] {
  const lines = csvText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);

  // Parse data rows
  const transactions: DraftTransaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    
    // Skip empty rows
    if (values.every((v) => !v || v.trim() === '')) {
      continue;
    }

    // Map values to row object
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    try {
      const transaction = parseCommerzbankRow(row, i);
      transactions.push(transaction);
    } catch (error) {
      console.error(`Error parsing row ${i}:`, error);
      // Continue with other rows even if one fails
    }
  }

  return transactions;
}

/**
 * Simple CSV line parser (handles quoted fields)
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      // Semicolon separator (Commerzbank uses semicolon)
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}












export interface ParsedTransaction {
  bookingDate: Date;
  valutaDate: Date;
  accountAmountCents: number;
  accountCurrency: string;
  descriptionRaw: string;
  sourceRef: string;
  txnExternalId?: string;
}

/**
 * Parse Commerzbank CSV format
 * Expected format: Date columns, Amount, Currency, Description, etc.
 */
export async function parseCsvCommerzbank(csvText: string): Promise<ParsedTransaction[]> {
  const lines = csvText.split('\n').filter(line => line.trim());
  // #region agent log
  console.log('[DEBUG PARSER] Lines count:', lines.length);
  // #endregion
  if (lines.length < 2) {
    console.log('[DEBUG PARSER] Less than 2 lines, returning empty');
    return [];
  }

  // Try to detect header row
  const headerLine = lines[0].toLowerCase();
  let dateCol = -1;
  let valutaCol = -1;
  let amountCol = -1;
  let currencyCol = -1;
  let descCol = -1;
  let refCol = -1;

  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
  // #region agent log
  console.log('[DEBUG PARSER] Headers:', headers);
  // #endregion

  // Common Commerzbank CSV column names
  headers.forEach((h, i) => {
    if (h.includes('buchung') || h.includes('booking') || h.includes('datum')) {
      if (h.includes('valuta') || h.includes('wert')) {
        valutaCol = i;
      } else {
        dateCol = i;
      }
    } else if (h.includes('betrag') || h.includes('amount') || h.includes('umsatz')) {
      amountCol = i;
    } else if (h.includes('währung') || h.includes('currency') || h.includes('waehrung')) {
      currencyCol = i;
    } else if (h.includes('verwendungszweck') || h.includes('description') || h.includes('text') || h.includes('zweck')) {
      descCol = i;
    } else if (h.includes('referenz') || h.includes('reference') || h.includes('id')) {
      refCol = i;
    }
  });

  // Fallback: assume first columns are date, amount, currency, description
  if (dateCol === -1) dateCol = 0;
  if (amountCol === -1) amountCol = 1;
  if (currencyCol === -1) currencyCol = 2;
  if (descCol === -1) descCol = 3;

  // #region agent log
  console.log('[DEBUG PARSER] Column mapping:', { dateCol, valutaCol, amountCol, currencyCol, descCol, refCol });
  // #endregion

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(';').map(cell => cell.trim());
    // #region agent log
    console.log(`[DEBUG PARSER] Row ${i}:`, row);
    // #endregion
    if (row.length < 2) continue;

    try {
      // Parse dates (common formats: DD.MM.YYYY, YYYY-MM-DD)
      const dateStr = row[dateCol] || '';
      const valutaStr = valutaCol >= 0 ? (row[valutaCol] || dateStr) : dateStr;

      const bookingDate = parseDate(dateStr);
      const valutaDate = parseDate(valutaStr) || bookingDate;

      // #region agent log
      console.log(`[DEBUG PARSER] Row ${i} dates:`, { dateStr, valutaStr, bookingDate, valutaDate });
      // #endregion

      if (!bookingDate) {
        console.log(`[DEBUG PARSER] Row ${i} skipped - no booking date`);
        continue;
      }

      // Parse amount (remove thousand separators, handle comma as decimal)
      const amountStr = row[amountCol] || '0';
      const cleanedAmount = amountStr.replace(/[^\d.,-]/g, '').replace(',', '.');
      const amount = parseFloat(cleanedAmount);
      // #region agent log
      console.log(`[DEBUG PARSER] Row ${i} amount:`, { amountStr, cleanedAmount, amount });
      // #endregion
      if (isNaN(amount)) {
        console.log(`[DEBUG PARSER] Row ${i} skipped - invalid amount`);
        continue;
      }

      const accountAmountCents = Math.round(amount * 100);
      const accountCurrency = (row[currencyCol] || 'EUR').toUpperCase().trim();
      const descriptionRaw = row[descCol] || '';
      const txnExternalId = refCol >= 0 ? (row[refCol] || undefined) : undefined;

      transactions.push({
        bookingDate,
        valutaDate,
        accountAmountCents,
        accountCurrency,
        descriptionRaw,
        sourceRef: `row:${i}`,
        txnExternalId,
      });
    } catch (error) {
      console.warn(`Error parsing row ${i}:`, error);
      continue;
    }
  }

  return transactions;
}

/**
 * Parse Commerzbank PDF format
 */
export async function parsePdfCommerzbank(buffer: Buffer): Promise<{
  text: string;
  transactions: ParsedTransaction[];
}> {
  // #region agent log
  console.log('[DEBUG PDF] Starting PDF parse, buffer size:', buffer.length);
  // #endregion
  
  // pdf-parse v2.x uses a class-based API
  const { PDFParse } = await import('pdf-parse');
  
  const parser = new PDFParse({ data: buffer });
  const textResult = await parser.getText();
  await parser.destroy();
  
  const text = textResult.text;

  // #region agent log
  console.log('[DEBUG PDF] Extracted text length:', text?.length || 0);
  console.log('[DEBUG PDF] First 1000 chars of extracted text:', text?.substring(0, 1000));
  // #endregion

  if (!text || text.trim().length === 0) {
    console.log('[DEBUG PDF] No text extracted from PDF');
    throw new Error('PDF contains no extractable text. OCR may be required.');
  }

  // Normalize text: remove extra spaces between characters (common PDF extraction issue)
  // This handles cases like "2 8 . 1 1 . 2 0 2 5" -> "28.11.2025"
  const normalizedText = text
    // Fix dates: "2 8 . 1 1 . 2 0 2 5" -> "28.11.2025"
    .replace(/(\d)\s+(\d)/g, '$1$2')
    .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
    // Fix amounts: "1 9 , 9 0" -> "19,90"
    .replace(/(\d)\s*,\s*(\d)/g, '$1,$2')
    // Fix currency: "EUR 0" at end of amount lines
    .replace(/(\d)\s+(EUR|USD|GBP|CHF)/g, '$1 $2');

  // #region agent log
  console.log('[DEBUG PDF] Normalized text sample:', normalizedText.substring(0, 1000));
  // #endregion

  // Simple regex-based parsing for Commerzbank PDF
  // This is a basic implementation - may need refinement
  const lines = normalizedText.split('\n').filter(line => line.trim());
  // #region agent log
  console.log('[DEBUG PDF] Lines count:', lines.length);
  console.log('[DEBUG PDF] First 10 lines:', lines.slice(0, 10));
  // #endregion
  const transactions: ParsedTransaction[] = [];

  // Look for transaction patterns
  // Commerzbank formats:
  // 1. Full date: DD.MM.YYYY with amount and currency
  // 2. Short date: DD.MM with amount (minus at end for expenses)
  const fullDatePattern = /(\d{2}\.\d{2}\.\d{4})/g;
  const shortDatePattern = /(\d{2}\.\d{2})(?!\.\d)/; // DD.MM not followed by .YYYY
  const amountPattern = /([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s+([A-Z]{3})/;
  // Commerzbank specific: amount followed by - or + (e.g., "19,90 -")
  const cbAmountPattern = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*([+-])/;

  let matchedLines = 0;
  let currentYear = new Date().getFullYear();
  
  // Try to extract year from document header (e.g., "Kontoauszug vom 28.11.2025")
  const headerYearMatch = normalizedText.match(/(\d{2}\.\d{2}\.(\d{4}))/);
  if (headerYearMatch) {
    currentYear = parseInt(headerYearMatch[2]);
  }
  // #region agent log
  console.log('[DEBUG PDF] Using year:', currentYear);
  // #endregion

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fullDates = line.match(fullDatePattern);
    const shortDateMatch = line.match(shortDatePattern);
    const amountMatch = line.match(amountPattern);
    const cbAmountMatch = line.match(cbAmountPattern);

    // #region agent log
    if (fullDates || shortDateMatch || amountMatch || cbAmountMatch) {
      console.log(`[DEBUG PDF] Line ${i}:`, { 
        line: line.substring(0, 100), 
        fullDates, 
        shortDate: shortDateMatch?.[0],
        amountMatch: amountMatch?.[0],
        cbAmountMatch: cbAmountMatch?.[0]
      });
      matchedLines++;
    }
    // #endregion

    // Try full date format first (DD.MM.YYYY AMOUNT CURRENCY)
    if (fullDates && fullDates.length >= 1 && amountMatch) {
      try {
        const bookingDate = parseDate(fullDates[0]);
        const valutaDate = fullDates.length >= 2 ? parseDate(fullDates[1]) : bookingDate;

        if (!bookingDate) continue;

        const amountStr = amountMatch[1].replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) continue;

        const accountAmountCents = Math.round(amount * 100);
        const accountCurrency = amountMatch[2];
        const descriptionRaw = line.substring(0, line.indexOf(fullDates[0])).trim();

        transactions.push({
          bookingDate,
          valutaDate: valutaDate || bookingDate,
          accountAmountCents,
          accountCurrency,
          descriptionRaw,
          sourceRef: `line:${i}`,
        });
        continue;
      } catch (error) {
        console.warn(`Error parsing PDF line ${i}:`, error);
      }
    }

    // Try Commerzbank format: "Description DD.MM AMOUNT -/+"
    if (shortDateMatch && cbAmountMatch) {
      try {
        const dateStr = `${shortDateMatch[1]}.${currentYear}`;
        const bookingDate = parseDate(dateStr);

        if (!bookingDate) continue;

        const amountStr = cbAmountMatch[1].replace(/\./g, '').replace(',', '.');
        let amount = parseFloat(amountStr);
        if (isNaN(amount)) continue;

        // Apply sign
        if (cbAmountMatch[2] === '-') {
          amount = -amount;
        }

        const accountAmountCents = Math.round(amount * 100);
        const descriptionRaw = line.substring(0, line.indexOf(shortDateMatch[0])).trim();

        transactions.push({
          bookingDate,
          valutaDate: bookingDate,
          accountAmountCents,
          accountCurrency: 'EUR', // Default for Commerzbank
          descriptionRaw,
          sourceRef: `line:${i}`,
        });
      } catch (error) {
        console.warn(`Error parsing PDF line ${i}:`, error);
        continue;
      }
    }
  }

  // #region agent log
  console.log('[DEBUG PDF] Parse complete. Matched lines:', matchedLines, 'Transactions found:', transactions.length);
  // #endregion

  return { text: normalizedText, transactions };
}

/**
 * Parse date string in common formats
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // DD.MM.YYYY
  const ddmmyyyy = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(
      parseInt(ddmmyyyy[3]),
      parseInt(ddmmyyyy[2]) - 1,
      parseInt(ddmmyyyy[1])
    );
  }

  // YYYY-MM-DD
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    return new Date(
      parseInt(yyyymmdd[1]),
      parseInt(yyyymmdd[2]) - 1,
      parseInt(yyyymmdd[3])
    );
  }

  // Try native Date parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}


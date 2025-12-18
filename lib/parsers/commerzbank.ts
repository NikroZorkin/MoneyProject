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
  if (lines.length < 2) {
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

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(';').map(cell => cell.trim());
    if (row.length < 2) continue;

    try {
      // Parse dates (common formats: DD.MM.YYYY, YYYY-MM-DD)
      const dateStr = row[dateCol] || '';
      const valutaStr = valutaCol >= 0 ? (row[valutaCol] || dateStr) : dateStr;

      const bookingDate = parseDate(dateStr);
      const valutaDate = parseDate(valutaStr) || bookingDate;

      if (!bookingDate) continue;

      // Parse amount (remove thousand separators, handle comma as decimal)
      const amountStr = row[amountCol] || '0';
      const cleanedAmount = amountStr.replace(/[^\d.,-]/g, '').replace(',', '.');
      const amount = parseFloat(cleanedAmount);
      if (isNaN(amount)) continue;

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
  // pdf-parse v2.x uses a class-based API
  const { PDFParse } = await import('pdf-parse');
  
  const parser = new PDFParse({ data: buffer });
  const textResult = await parser.getText();
  await parser.destroy();
  
  const text = textResult.text;

  if (!text || text.trim().length === 0) {
    throw new Error('PDF contains no extractable text. OCR may be required.');
  }

  // Simple regex-based parsing for Commerzbank PDF
  // This is a basic implementation - may need refinement
  const lines = text.split('\n').filter(line => line.trim());
  const transactions: ParsedTransaction[] = [];

  // Look for transaction patterns
  // Common format: DD.MM.YYYY DD.MM.YYYY AMOUNT CURRENCY Description...
  const datePattern = /(\d{2}\.\d{2}\.\d{4})/g;
  const amountPattern = /([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s+([A-Z]{3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dates = line.match(datePattern);
    const amountMatch = line.match(amountPattern);

    if (dates && dates.length >= 1 && amountMatch) {
      try {
        const bookingDate = parseDate(dates[0]);
        const valutaDate = dates.length >= 2 ? parseDate(dates[1]) : bookingDate;

        if (!bookingDate) continue;

        const amountStr = amountMatch[1].replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) continue;

        const accountAmountCents = Math.round(amount * 100);
        const accountCurrency = amountMatch[2];
        const descriptionRaw = line.substring(line.indexOf(amountMatch[0]) + amountMatch[0].length).trim();

        transactions.push({
          bookingDate,
          valutaDate: valutaDate || bookingDate,
          accountAmountCents,
          accountCurrency,
          descriptionRaw,
          sourceRef: `line:${i}`,
        });
      } catch (error) {
        console.warn(`Error parsing PDF line ${i}:`, error);
        continue;
      }
    }
  }

  return { text, transactions };
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


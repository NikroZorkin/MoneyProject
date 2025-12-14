// @ts-nocheck
import { parseCsvCommerzbank } from '@/lib/parsers/commerzbank';
import * as fs from 'fs';
import * as path from 'path';

describe('Commerzbank CSV Parser', () => {
  it('should parse sample CSV correctly', async () => {
    const fixturePath = path.join(__dirname, '../fixtures/extracted-text/commerzbank-sample.txt');
    const csvText = fs.readFileSync(fixturePath, 'utf-8');
    const expectedPath = path.join(__dirname, '../fixtures/expected-transactions/commerzbank-sample.json');
    const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));

    const result = await parseCsvCommerzbank(csvText);

    expect(result).toHaveLength(expected.length);

    result.forEach((tx, index) => {
      expect(tx.bookingDate.toISOString()).toBe(expected[index].bookingDate);
      expect(tx.valutaDate.toISOString()).toBe(expected[index].valutaDate);
      expect(tx.accountAmountCents).toBe(expected[index].accountAmountCents);
      expect(tx.accountCurrency).toBe(expected[index].accountCurrency);
      expect(tx.descriptionRaw).toBe(expected[index].descriptionRaw);
      expect(tx.sourceRef).toBe(expected[index].sourceRef);
    });
  });

  it('should handle empty CSV', async () => {
    const result = await parseCsvCommerzbank('');
    expect(result).toHaveLength(0);
  });

  it('should handle CSV with only header', async () => {
    const csvText = 'Buchungstag;Valutadatum;Betrag;Währung;Verwendungszweck\n';
    const result = await parseCsvCommerzbank(csvText);
    expect(result).toHaveLength(0);
  });
});


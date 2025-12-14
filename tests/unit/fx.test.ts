// @ts-nocheck
import { convertAmount, getFxRate } from '@/lib/fx';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

describe('FX Conversion', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.fxRate.deleteMany({});
  });

  it('should return 1:1 rate for same currency', async () => {
    const date = new Date('2024-12-01');
    const rate = await getFxRate(date, 'EUR', 'EUR');
    expect(rate).not.toBeNull();
    expect(rate!.rate.toNumber()).toBe(1);
  });

  it('should convert EUR to USD when rate exists', async () => {
    // Create test rate
    await prisma.fxRate.create({
      data: {
        date: new Date('2024-12-01'),
        baseCurrency: 'EUR',
        quoteCurrency: 'USD',
        rate: new Decimal(1.1),
        source: 'ECB',
      },
    });

    const result = await convertAmount(
      10000, // 100 EUR
      'EUR',
      'USD',
      new Date('2024-12-01'),
      new Date('2024-12-01')
    );

    expect(result).not.toBeNull();
    expect(result!.convertedAmountCents).toBe(11000); // 110 USD
    expect(result!.fxDateSource).toBe('VALUTA');
  });

  it('should use bookingDate fallback when valutaDate rate not found', async () => {
    // Create rate only for bookingDate
    await prisma.fxRate.create({
      data: {
        date: new Date('2024-12-01'),
        baseCurrency: 'EUR',
        quoteCurrency: 'USD',
        rate: new Decimal(1.1),
        source: 'ECB',
      },
    });

    const result = await convertAmount(
      10000,
      'EUR',
      'USD',
      new Date('2024-12-05'), // valutaDate - no rate
      new Date('2024-12-01')  // bookingDate - has rate
    );

    expect(result).not.toBeNull();
    expect(result!.fxDateSource).toBe('BOOKING_FALLBACK');
  });
});


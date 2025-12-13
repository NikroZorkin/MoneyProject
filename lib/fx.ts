import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { roundHalfUp } from './money';

export type FxDateSource = 'VALUTA' | 'BOOKING_FALLBACK' | 'MANUAL';

export interface FxConversionResult {
  convertedAmountCents: number;
  fxRateUsed: Decimal;
  fxDateUsed: Date;
  fxDateSource: FxDateSource;
}

/**
 * Get FX rate for a date (or latest available before that date)
 */
export async function getFxRate(
  date: Date,
  baseCurrency: string,
  quoteCurrency: string
): Promise<{ rate: Decimal; date: Date } | null> {
  if (baseCurrency === quoteCurrency) {
    return { rate: new Decimal(1), date };
  }

  // ECB uses EUR as base
  const isEurBase = baseCurrency === 'EUR';
  const isEurQuote = quoteCurrency === 'EUR';

  let targetBase = baseCurrency;
  let targetQuote = quoteCurrency;

  if (!isEurBase && !isEurQuote) {
    // Cross-rate: need EUR -> base and EUR -> quote
    // For MVP, we'll fetch both and calculate
    // Simplified: assume we have direct rates or need to fetch both
  }

  // Find rate on or before the date
  const rate = await prisma.fxRate.findFirst({
    where: {
      baseCurrency: targetBase,
      quoteCurrency: targetQuote,
      date: {
        lte: date,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  if (!rate) {
    return null;
  }

  return { rate: rate.rate, date: rate.date };
}

/**
 * Convert amount from one currency to another using FX rates
 */
export async function convertAmount(
  amountCents: number,
  fromCurrency: string,
  toCurrency: string,
  valutaDate: Date,
  bookingDate: Date
): Promise<FxConversionResult | null> {
  if (fromCurrency === toCurrency) {
    return {
      convertedAmountCents: amountCents,
      fxRateUsed: new Decimal(1),
      fxDateUsed: valutaDate,
      fxDateSource: 'VALUTA',
    };
  }

  // Try valutaDate first
  let fxData = await getFxRate(valutaDate, fromCurrency, toCurrency);
  let fxDateSource: FxDateSource = 'VALUTA';

  // Fallback to bookingDate if valutaDate rate not found
  if (!fxData) {
    fxData = await getFxRate(bookingDate, fromCurrency, toCurrency);
    fxDateSource = 'BOOKING_FALLBACK';
  }

  if (!fxData) {
    return null;
  }

  const rate = fxData.rate.toNumber();
  const converted = (amountCents * rate);
  const convertedAmountCents = roundHalfUp(converted);

  return {
    convertedAmountCents,
    fxRateUsed: fxData.rate,
    fxDateUsed: fxData.date,
    fxDateSource,
  };
}

/**
 * Fetch ECB rates (SDMX REST API)
 * For MVP, we'll implement a basic version
 */
export async function fetchEcbRates(date: Date): Promise<void> {
  // TODO: Implement ECB SDMX REST API call
  // For now, this is a placeholder
  // ECB API: https://data.ecb.europa.eu/data/datasets/EXR
  throw new Error('ECB rate fetching not yet implemented');
}


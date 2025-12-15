import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { roundHalfUp } from './money';

// Prisma 6 uses Prisma.Decimal
const Decimal = Prisma.Decimal;

export type FxDateSource = 'VALUTA' | 'BOOKING_FALLBACK' | 'MANUAL';

export interface FxConversionResult {
  convertedAmountCents: number;
  fxRateUsed: Decimal;
  fxDateUsed: Date;
  fxDateSource: FxDateSource;
}

/**
 * Fetch ECB rates for a specific date and currency pair
 * ECB SDMX REST API: https://data.ecb.europa.eu/api/data/EXR/D.{BASE}.{QUOTE}.SP00.A
 */
async function fetchEcbRateForPair(
  date: Date,
  baseCurrency: string,
  quoteCurrency: string
): Promise<{ rate: Decimal; date: Date } | null> {
  // ECB only provides EUR as base
  if (baseCurrency !== 'EUR') {
    return null;
  }

  // Check if already cached
  const existing = await prisma.fxRate.findUnique({
    where: {
      date_baseCurrency_quoteCurrency: {
        date,
        baseCurrency,
        quoteCurrency,
      },
    },
  });

  if (existing) {
    return { rate: existing.rate, date: existing.date };
  }

  try {
    // ECB API: D.{BASE}.{QUOTE}.SP00.A format
    // Using JSON format for easier parsing
    const currencyCode = quoteCurrency.toUpperCase();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://data.ecb.europa.eu/api/data/EXR/D.${baseCurrency}.${currencyCode}.SP00.A?format=jsondata&startPeriod=${dateStr}&endPeriod=${dateStr}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`ECB API error for ${baseCurrency}/${quoteCurrency} on ${dateStr}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Parse SDMX JSON structure
    const dataset = data?.dataSets?.[0]?.series?.['0:0:0:0:0'];
    if (!dataset) {
      return null;
    }

    const observations = dataset.observations;
    if (!observations || Object.keys(observations).length === 0) {
      return null;
    }

    // Get first observation value
    const firstKey = Object.keys(observations)[0];
    const rateValue = observations[firstKey][0] as number;

    if (!rateValue || isNaN(rateValue)) {
      return null;
    }

    const rate = new Decimal(rateValue);

    // Store in database
    await prisma.fxRate.upsert({
      where: {
        date_baseCurrency_quoteCurrency: {
          date,
          baseCurrency,
          quoteCurrency,
        },
      },
      create: {
        date,
        baseCurrency,
        quoteCurrency,
        rate,
        source: 'ECB',
      },
      update: {
        rate,
      },
    });

    return { rate, date };
  } catch (error) {
    console.error(`Error fetching ECB rate for ${baseCurrency}/${quoteCurrency}:`, error);
    return null;
  }
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

  // If both are EUR or same currency, return 1
  if (isEurBase && isEurQuote) {
    return { rate: new Decimal(1), date };
  }

  // Direct ECB rate: EUR -> quote
  if (isEurBase) {
    let rate = await prisma.fxRate.findFirst({
      where: {
        baseCurrency: 'EUR',
        quoteCurrency,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });

    // If not found, try fetching from ECB
    if (!rate) {
      const fetched = await fetchEcbRateForPair(date, 'EUR', quoteCurrency);
      if (fetched) {
        return fetched;
      }
      // If still not found, try previous available date
      rate = await prisma.fxRate.findFirst({
        where: {
          baseCurrency: 'EUR',
          quoteCurrency,
          date: { lte: date },
        },
        orderBy: { date: 'desc' },
      });
    }

    if (!rate) return null;
    return { rate: rate.rate, date: rate.date };
  }

  // Inverse rate: base -> EUR (need 1 / (EUR -> base))
  if (isEurQuote) {
    const rate = await prisma.fxRate.findFirst({
      where: {
        baseCurrency: 'EUR',
        quoteCurrency: baseCurrency,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });

    if (!rate) return null;
    // Inverse: 1 / rate
    const inverseRate = new Decimal(1).div(rate.rate);
    return { rate: inverseRate, date: rate.date };
  }

  // Cross-rate: base -> quote (when neither is EUR)
  // Calculate: (EUR -> quote) / (EUR -> base)
  const baseRate = await prisma.fxRate.findFirst({
    where: {
      baseCurrency: 'EUR',
      quoteCurrency: baseCurrency,
      date: { lte: date },
    },
    orderBy: { date: 'desc' },
  });

  const quoteRate = await prisma.fxRate.findFirst({
    where: {
      baseCurrency: 'EUR',
      quoteCurrency,
      date: { lte: date },
    },
    orderBy: { date: 'desc' },
  });

  if (!baseRate || !quoteRate) {
    return null;
  }

  // Cross-rate: (EUR/quote) / (EUR/base) = base/quote
  const crossRate = quoteRate.rate.div(baseRate.rate);
  // Use the earlier date of the two rates
  const rateDate = baseRate.date < quoteRate.date ? baseRate.date : quoteRate.date;

  return { rate: crossRate, date: rateDate };
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
 * Fetch ECB rates for a date
 * Attempts to fetch common currency pairs and caches them
 */
export async function fetchEcbRates(date: Date, currencies?: string[]): Promise<void> {
  // Common currencies to fetch
  const defaultCurrencies = ['USD', 'GBP', 'JPY', 'CHF', 'PLN', 'CZK', 'SEK', 'NOK', 'DKK'];
  const targetCurrencies = currencies || defaultCurrencies;

  // Fetch all EUR -> currency pairs for the date
  const fetchPromises = targetCurrencies.map((currency) =>
    fetchEcbRateForPair(date, 'EUR', currency)
  );

  await Promise.all(fetchPromises);
  // Errors are handled inside fetchEcbRateForPair, so we don't throw here
}



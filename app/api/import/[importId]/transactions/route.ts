import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ importId: string }> }
) {
  try {
    const { importId } = await params;

    const transactions = await prisma.transaction.findMany({
      where: { importId },
      include: {
        category: {
          include: {
            translations: {
              where: {
                locale: request.headers.get('x-locale') || 'en',
              },
            },
          },
        },
      },
      orderBy: { bookingDate: 'desc' },
    });

    const locale = request.headers.get('x-locale') || 'en';

    const formatted = transactions.map(tx => ({
      id: tx.id,
      bookingDate: tx.bookingDate.toISOString(),
      accountAmountCents: tx.accountAmountCents,
      accountCurrency: tx.accountCurrency,
      convertedAmountCents: tx.convertedAmountCents,
      reportCurrency: tx.reportCurrency,
      descriptionRaw: tx.descriptionRaw,
      merchantNormalized: tx.merchantNormalized,
      categoryId: tx.categoryId,
      categoryName: tx.category?.translations[0]?.name || tx.category?.key || null,
      isReviewed: tx.isReviewed,
      confidence: tx.confidence,
      sourceRef: tx.sourceRef,
    }));

    return NextResponse.json({ transactions: formatted });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

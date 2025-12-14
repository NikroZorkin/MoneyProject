import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ importId: string }> }
) {
  try {
    const { importId } = await params;
    const body = await request.json();
    const { transactions } = body;

    if (!Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Update transactions
    await Promise.all(
      transactions.map((tx: { id: string; categoryId?: string | null; merchantNormalized?: string | null }) =>
        prisma.transaction.update({
          where: { id: tx.id },
          data: {
            categoryId: tx.categoryId || null,
            merchantNormalized: tx.merchantNormalized || null,
            isReviewed: true,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    );
  }
}

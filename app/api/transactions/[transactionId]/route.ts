import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTransactionSchema = z.object({
  bookingDate: z.string().datetime().optional(),
  valutaDate: z.string().datetime().optional(),
  accountAmountCents: z.number().optional(),
  accountCurrency: z.string().optional(),
  descriptionRaw: z.string().optional(),
  merchantNormalized: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  isReviewed: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const body = await request.json();
    
    const validated = updateTransactionSchema.parse(body);

    // Prepare update data
    const updateData: any = {};
    
    if (validated.bookingDate !== undefined) {
      updateData.bookingDate = new Date(validated.bookingDate);
    }
    if (validated.valutaDate !== undefined) {
      updateData.valutaDate = new Date(validated.valutaDate);
    }
    if (validated.accountAmountCents !== undefined) {
      updateData.accountAmountCents = validated.accountAmountCents;
    }
    if (validated.accountCurrency !== undefined) {
      updateData.accountCurrency = validated.accountCurrency;
    }
    if (validated.descriptionRaw !== undefined) {
      updateData.descriptionRaw = validated.descriptionRaw;
    }
    if (validated.merchantNormalized !== undefined) {
      updateData.merchantNormalized = validated.merchantNormalized;
    }
    if (validated.categoryId !== undefined) {
      updateData.categoryId = validated.categoryId;
    }
    if (validated.isReviewed !== undefined) {
      updateData.isReviewed = validated.isReviewed;
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        category: {
          include: {
            translations: true,
          },
        },
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}








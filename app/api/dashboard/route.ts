import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const reportCurrency = searchParams.get('currency') || 'EUR';

    const targetDate = month ? new Date(month) : new Date();
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Get all transactions for the month (by bookingDate)
    const transactions = await prisma.transaction.findMany({
      where: {
        bookingDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        isReviewed: true,
        reportCurrency,
      },
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
    });

    // Calculate totals
    const expenses = transactions
      .filter(tx => tx.convertedAmountCents !== null && tx.convertedAmountCents < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.convertedAmountCents!), 0);

    const income = transactions
      .filter(tx => tx.convertedAmountCents !== null && tx.convertedAmountCents > 0)
      .reduce((sum, tx) => sum + tx.convertedAmountCents!, 0);

    const balance = income - expenses;

    // Top categories by expense
    const categoryExpenses = new Map<string, { name: string; amount: number }>();
    transactions
      .filter(tx => tx.convertedAmountCents !== null && tx.convertedAmountCents < 0 && tx.categoryId)
      .forEach(tx => {
        const catName = tx.category?.translations[0]?.name || tx.category?.key || 'Uncategorized';
        const current = categoryExpenses.get(tx.categoryId!) || { name: catName, amount: 0 };
        categoryExpenses.set(tx.categoryId!, {
          ...current,
          amount: current.amount + Math.abs(tx.convertedAmountCents!),
        });
      });

    const topCategories = Array.from(categoryExpenses.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Daily trend (expenses by day)
    const dailyTrend = new Map<string, number>();
    transactions
      .filter(tx => tx.convertedAmountCents !== null && tx.convertedAmountCents < 0)
      .forEach(tx => {
        const dayKey = tx.bookingDate.toISOString().split('T')[0];
        const current = dailyTrend.get(dayKey) || 0;
        dailyTrend.set(dayKey, current + Math.abs(tx.convertedAmountCents!));
      });

    const dailyTrendArray = Array.from(dailyTrend.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      month: monthStart.toISOString(),
      currency: reportCurrency,
      expenses,
      income,
      balance,
      topCategories,
      dailyTrend: dailyTrendArray,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

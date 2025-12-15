import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/route.ts:5',message:'Dashboard API entry',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const reportCurrency = searchParams.get('currency') || 'EUR';

    const targetDate = month ? new Date(month) : new Date();
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/route.ts:15',message:'Before Prisma query',data:{monthStart:monthStart.toISOString(),monthEnd:monthEnd.toISOString(),reportCurrency},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/route.ts:37',message:'After Prisma query',data:{transactionCount:transactions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

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

    const responseData = {
      month: monthStart.toISOString(),
      currency: reportCurrency,
      expenses,
      income,
      balance,
      topCategories,
      dailyTrend: dailyTrendArray,
      transactionCount: transactions.length,
    };
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/route.ts:90',message:'Before return response',data:{expenses,income,balance},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json(responseData);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/3fd1a540-59ca-4abc-88b9-9a8b673c0610',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/dashboard/route.ts:95',message:'Dashboard API error',data:{errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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

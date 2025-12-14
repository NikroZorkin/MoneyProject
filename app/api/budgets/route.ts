import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const currency = searchParams.get('currency') || 'EUR';

    const targetDate = month ? new Date(month) : new Date();
    const monthStart = startOfMonth(targetDate);

    const budgetMonth = await prisma.budgetMonth.findUnique({
      where: {
        month_currency: {
          month: monthStart,
          currency,
        },
      },
      include: {
        categories: {
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
        },
        incomePlans: true,
      },
    });

    return NextResponse.json({ budget: budgetMonth });
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, currency, totalLimitCents, categoryBudgets, incomePlans } = body;

    if (!month || !currency) {
      return NextResponse.json({ error: 'Month and currency required' }, { status: 400 });
    }

    const monthStart = startOfMonth(new Date(month));

    const budgetMonth = await prisma.budgetMonth.upsert({
      where: {
        month_currency: {
          month: monthStart,
          currency,
        },
      },
      create: {
        month: monthStart,
        currency,
        totalLimitCents: totalLimitCents || null,
        categories: categoryBudgets
          ? {
              create: categoryBudgets.map((cb: { categoryId: string; limitCents: number }) => ({
                categoryId: cb.categoryId,
                limitCents: cb.limitCents,
              })),
            }
          : undefined,
        incomePlans: incomePlans
          ? {
              create: incomePlans.map((ip: { name: string; plannedAmountCents: number }) => ({
                name: ip.name,
                plannedAmountCents: ip.plannedAmountCents,
              })),
            }
          : undefined,
      },
      update: {
        totalLimitCents: totalLimitCents !== undefined ? totalLimitCents : undefined,
        categories: categoryBudgets
          ? {
              deleteMany: {},
              create: categoryBudgets.map((cb: { categoryId: string; limitCents: number }) => ({
                categoryId: cb.categoryId,
                limitCents: cb.limitCents,
              })),
            }
          : undefined,
        incomePlans: incomePlans
          ? {
              deleteMany: {},
              create: incomePlans.map((ip: { name: string; plannedAmountCents: number }) => ({
                name: ip.name,
                plannedAmountCents: ip.plannedAmountCents,
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        incomePlans: true,
      },
    });

    return NextResponse.json({ budget: budgetMonth });
  } catch (error) {
    console.error('Error saving budget:', error);
    return NextResponse.json(
      { error: 'Failed to save budget' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, locale, name } = body;

    if (!categoryId || !locale || !name) {
      return NextResponse.json(
        { error: 'categoryId, locale, and name are required' },
        { status: 400 }
      );
    }

    await prisma.categoryTranslation.upsert({
      where: {
        categoryId_locale: {
          categoryId,
          locale,
        },
      },
      create: {
        categoryId,
        locale,
        name,
      },
      update: {
        name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving category translation:', error);
    return NextResponse.json(
      { error: 'Failed to save category translation' },
      { status: 500 }
    );
  }
}


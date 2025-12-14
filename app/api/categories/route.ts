import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const locale = request.headers.get('x-locale') || request.nextUrl.searchParams.get('locale') || 'en';

    const categories = await prisma.category.findMany({
      include: {
        translations: {
          where: { locale },
        },
      },
      orderBy: { key: 'asc' },
    });

    const formatted = categories.map(cat => ({
      id: cat.id,
      key: cat.key,
      name: cat.translations[0]?.name || cat.key,
    }));

    return NextResponse.json({ categories: formatted });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

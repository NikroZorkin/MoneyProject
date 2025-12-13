import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { key: 'food_groceries', defaultName: 'Groceries' },
  { key: 'food_restaurant', defaultName: 'Restaurants' },
  { key: 'transport_public', defaultName: 'Public Transport' },
  { key: 'transport_car', defaultName: 'Car' },
  { key: 'utilities_electricity', defaultName: 'Electricity' },
  { key: 'utilities_water', defaultName: 'Water' },
  { key: 'utilities_internet', defaultName: 'Internet' },
  { key: 'entertainment', defaultName: 'Entertainment' },
  { key: 'healthcare', defaultName: 'Healthcare' },
  { key: 'shopping', defaultName: 'Shopping' },
  { key: 'income_salary', defaultName: 'Salary' },
  { key: 'income_other', defaultName: 'Other Income' },
  { key: 'uncategorized', defaultName: 'Uncategorized' },
];

async function main() {
  console.log('Seeding categories...');

  for (const cat of defaultCategories) {
    const category = await prisma.category.upsert({
      where: { key: cat.key },
      update: {},
      create: {
        key: cat.key,
        translations: {
          create: [
            { locale: 'en', name: cat.defaultName },
            { locale: 'ru', name: cat.defaultName }, // Will be updated via UI
            { locale: 'de', name: cat.defaultName }, // Will be updated via UI
          ],
        },
      },
    });

    console.log(`Created/updated category: ${category.key}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


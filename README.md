# Money Project

Personal finance management application with PDF/CSV import, transaction review, budgeting, and multi-currency support.

## Features

- **Import**: CSV and PDF statement import (Commerzbank format)
- **Review**: Transaction review table with inline editing, bulk category assignment
- **Dashboard**: Monthly overview with expenses, income, balance, and charts
- **Budgets**: Category-based budgets and income planning
- **Settings**: Multi-language support, currency selection, category management
- **FX Conversion**: Automatic currency conversion using ECB rates

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma + SQLite
- Tailwind CSS + shadcn/ui
- next-intl for internationalization
- Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:migrate
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # Internationalized routes
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
│   ├── parsers/          # CSV/PDF parsers
│   ├── fx.ts             # FX conversion logic
│   ├── money.ts          # Money formatting utilities
│   └── prisma.ts         # Prisma client
├── prisma/               # Prisma schema and migrations
├── tests/               # Test files
│   ├── fixtures/        # Test data
│   └── unit/            # Unit tests
└── messages/            # i18n translation files
```

## Key Features

### Import Pipeline

1. Upload CSV or PDF file
2. File hash check for deduplication
3. Extract and parse transactions
4. FX conversion to report currency
5. Create draft transactions
6. Review and edit in table UI
7. Commit reviewed transactions

### FX Conversion

- Uses ECB (European Central Bank) rates
- Automatic fetching and caching
- Supports cross-rates (non-EUR pairs)
- Fallback to previous available rate if date not found
- Tracks conversion source (valutaDate vs bookingDate)

### Data Model

- **Transaction**: Stores both original and converted amounts
- **Category**: Stable keys with locale-specific names
- **Budget**: Monthly budgets per category
- **Import**: Tracks file hashes for deduplication

## Development

### Database

```bash
# Create migration
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Seed categories
npm run db:seed
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## License

Private project

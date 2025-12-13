-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingDate" DATETIME NOT NULL,
    "valutaDate" DATETIME NOT NULL,
    "accountAmountCents" INTEGER NOT NULL,
    "accountCurrency" TEXT NOT NULL,
    "reportCurrency" TEXT NOT NULL,
    "convertedAmountCents" INTEGER,
    "fxRateUsed" DECIMAL,
    "fxDateUsed" DATETIME,
    "fxDateSource" TEXT,
    "descriptionRaw" TEXT NOT NULL,
    "merchantNormalized" TEXT,
    "categoryId" TEXT,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "confidence" REAL,
    "importId" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "txnExternalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "quoteCurrency" TEXT NOT NULL,
    "rate" DECIMAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ECB',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileHash" TEXT NOT NULL,
    "extractedTextHash" TEXT,
    "statementFrom" DATETIME,
    "statementTo" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetMonth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" DATETIME NOT NULL,
    "currency" TEXT NOT NULL,
    "region" TEXT,
    "totalLimitCents" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetMonthId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limitCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetCategory_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncomePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetMonthId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plannedAmountCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IncomePlan_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Transaction_importId_idx" ON "Transaction"("importId");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_bookingDate_idx" ON "Transaction"("bookingDate");

-- CreateIndex
CREATE INDEX "Transaction_isReviewed_idx" ON "Transaction"("isReviewed");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_importId_sourceRef_key" ON "Transaction"("importId", "sourceRef");

-- CreateIndex
CREATE INDEX "FxRate_date_idx" ON "FxRate"("date");

-- CreateIndex
CREATE INDEX "FxRate_baseCurrency_quoteCurrency_idx" ON "FxRate"("baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_date_baseCurrency_quoteCurrency_key" ON "FxRate"("date", "baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE UNIQUE INDEX "Import_fileHash_key" ON "Import"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "Import_extractedTextHash_key" ON "Import"("extractedTextHash");

-- CreateIndex
CREATE INDEX "Import_status_idx" ON "Import"("status");

-- CreateIndex
CREATE INDEX "Import_createdAt_idx" ON "Import"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");

-- CreateIndex
CREATE INDEX "CategoryTranslation_locale_idx" ON "CategoryTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE INDEX "BudgetMonth_month_idx" ON "BudgetMonth"("month");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetMonth_month_currency_key" ON "BudgetMonth"("month", "currency");

-- CreateIndex
CREATE INDEX "BudgetCategory_budgetMonthId_idx" ON "BudgetCategory"("budgetMonthId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_budgetMonthId_categoryId_key" ON "BudgetCategory"("budgetMonthId", "categoryId");

-- CreateIndex
CREATE INDEX "IncomePlan_budgetMonthId_idx" ON "IncomePlan"("budgetMonthId");

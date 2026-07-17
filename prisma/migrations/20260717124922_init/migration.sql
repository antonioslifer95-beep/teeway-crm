-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('LEAD', 'CONTACTED', 'BUDGET_SENT', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'STAGE_CHANGE', 'CALL', 'EMAIL', 'REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLANNED', 'IN_TRANSIT', 'CLEARED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'FLAT', 'PERCENT');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING_REVIEW', 'READY_TO_ISSUE', 'ISSUED', 'ERROR');

-- CreateEnum
CREATE TYPE "ToconlineDocType" AS ENUM ('FT', 'FS', 'FR');

-- CreateEnum
CREATE TYPE "ToconlineEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "nif" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PT',
    "pipelineStage" "PipelineStage" NOT NULL DEFAULT 'LEAD',
    "toconlineCustomerId" TEXT,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientActivity" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "type" "ActivityType" NOT NULL,
    "body" TEXT,
    "reminderDueAt" TIMESTAMP(3),
    "reminderDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartModel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seats" INTEGER,
    "defaultDescription" TEXT,
    "defaultGoodsCostOriginal" DECIMAL(12,2) NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "supplierName" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "originalCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "totalCostOriginal" DECIMAL(12,2) NOT NULL,
    "exchangeRateToEUR" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "customsDutyPercent" DECIMAL(6,3),
    "flatClearanceFee" DECIMAL(12,2),
    "status" "OrderStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCartItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "cartModelId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitGoodsCostOriginal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "deliveryTerms" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "subtotalExVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalIncVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "pdfBlobUrl" TEXT,
    "publicShareToken" TEXT,
    "publicShareEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "cartModelId" TEXT,
    "orderId" TEXT,
    "orderCartItemId" TEXT,
    "name" TEXT NOT NULL,
    "specText" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitLandedCostEUR" DECIMAL(12,2) NOT NULL,
    "customsDutyPercentSnapshot" DECIMAL(6,3) NOT NULL,
    "clearanceFeeSnapshot" DECIMAL(12,2) NOT NULL,
    "markupPercentSnapshot" DECIMAL(6,3) NOT NULL,
    "vatRateSnapshot" DECIMAL(6,3) NOT NULL,
    "unitSellPriceExVat" DECIMAL(12,2) NOT NULL,
    "unitSellPriceIncVat" DECIMAL(12,2) NOT NULL,
    "lineTotalExVat" DECIMAL(12,2) NOT NULL,
    "lineTotalIncVat" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "internalRef" TEXT NOT NULL,
    "quoteId" TEXT,
    "clientId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "subtotalExVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalIncVat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "toconlineDocumentId" TEXT,
    "toconlineDocumentType" "ToconlineDocType",
    "toconlineOfficialNumber" TEXT,
    "toconlineAtcud" TEXT,
    "toconlineQrCodeData" TEXT,
    "toconlinePdfUrl" TEXT,
    "lastSyncError" TEXT,
    "issuedAt" TIMESTAMP(3),
    "issuedByUserId" TEXT,
    "pdfBlobUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "specText" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitSellPriceExVat" DECIMAL(12,2) NOT NULL,
    "unitSellPriceIncVat" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(6,3) NOT NULL,
    "lineTotalExVat" DECIMAL(12,2) NOT NULL,
    "lineTotalIncVat" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "defaultCustomsDutyPercent" DECIMAL(6,3) NOT NULL DEFAULT 12.3,
    "defaultClearanceFee" DECIMAL(12,2) NOT NULL DEFAULT 150,
    "defaultMarkupPercent" DECIMAL(6,3) NOT NULL DEFAULT 100,
    "vatRate" DECIMAL(6,3) NOT NULL DEFAULT 23,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToconlineConnection" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "environment" "ToconlineEnvironment" NOT NULL DEFAULT 'SANDBOX',
    "obtainedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToconlineConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CartModel_code_key" ON "CartModel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_publicShareToken_key" ON "Quote"("publicShareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_internalRef_key" ON "Invoice"("internalRef");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientActivity" ADD CONSTRAINT "ClientActivity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientActivity" ADD CONSTRAINT "ClientActivity_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCartItem" ADD CONSTRAINT "OrderCartItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCartItem" ADD CONSTRAINT "OrderCartItem_cartModelId_fkey" FOREIGN KEY ("cartModelId") REFERENCES "CartModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_cartModelId_fkey" FOREIGN KEY ("cartModelId") REFERENCES "CartModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_orderCartItemId_fkey" FOREIGN KEY ("orderCartItemId") REFERENCES "OrderCartItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

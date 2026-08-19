-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "transportCostOriginal" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderCartItem" ADD COLUMN     "extraCostOriginal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "extraDescription" TEXT;

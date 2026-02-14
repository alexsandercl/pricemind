/*
  Warnings:

  - You are about to drop the column `alertEmail` on the `PriceMonitor` table. All the data in the column will be lost.
  - You are about to drop the column `alertEnabled` on the `PriceMonitor` table. All the data in the column will be lost.
  - You are about to drop the column `history` on the `PriceMonitor` table. All the data in the column will be lost.
  - Added the required column `initialPrice` to the `PriceMonitor` table without a default value. This is not possible if the table is not empty.
  - Made the column `currentPrice` on table `PriceMonitor` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "PriceMonitor_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "PriceMonitor" DROP COLUMN "alertEmail",
DROP COLUMN "alertEnabled",
DROP COLUMN "history",
ADD COLUMN     "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "frequency" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "initialPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "currentPrice" SET NOT NULL;

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceChange" DOUBLE PRECISION,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_monitorId_idx" ON "PriceHistory"("monitorId");

-- CreateIndex
CREATE INDEX "PriceHistory_checkedAt_idx" ON "PriceHistory"("checkedAt");

-- CreateIndex
CREATE INDEX "PriceMonitor_userId_idx" ON "PriceMonitor"("userId");

-- CreateIndex
CREATE INDEX "PriceMonitor_isActive_idx" ON "PriceMonitor"("isActive");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "PriceMonitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

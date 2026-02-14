/*
  Warnings:

  - You are about to drop the `ProductComparison` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ProductComparison";

-- CreateTable
CREATE TABLE "PriceComparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comparisonName" TEXT NOT NULL,
    "myProduct" JSONB NOT NULL,
    "competitors" JSONB NOT NULL,
    "aiAnalysis" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nova conversa',
    "messages" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "totalProducts" INTEGER NOT NULL,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceMonitor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION,
    "lastPrice" DOUBLE PRECISION,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertEmail" TEXT,
    "lastChecked" TIMESTAMP(3),
    "history" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceComparison_userId_createdAt_idx" ON "PriceComparison"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatConversation_userId_createdAt_idx" ON "ChatConversation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BatchAnalysis_userId_createdAt_idx" ON "BatchAnalysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceMonitor_userId_createdAt_idx" ON "PriceMonitor"("userId", "createdAt");

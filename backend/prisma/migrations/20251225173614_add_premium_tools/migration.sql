-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "experiencia" TEXT,
ADD COLUMN     "faixaPreco" TEXT,
ADD COLUMN     "objetivo" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoNegocio" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PremiumAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "link" TEXT,
    "productName" TEXT,
    "price" DOUBLE PRECISION,
    "category" TEXT,
    "description" TEXT,
    "aiResponse" TEXT NOT NULL,
    "extractedText" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PremiumAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitCalculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "productionCost" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCosts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "profitAmount" DOUBLE PRECISION NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,
    "netProfit" DOUBLE PRECISION NOT NULL,
    "aiSuggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfitCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductComparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comparisonName" TEXT NOT NULL,
    "products" JSONB NOT NULL,
    "aiAnalysis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSimulation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "scenarios" JSONB NOT NULL,
    "aiAnalysis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PremiumAnalysis_userId_type_createdAt_idx" ON "PremiumAnalysis"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ProfitCalculation_userId_createdAt_idx" ON "ProfitCalculation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductComparison_userId_createdAt_idx" ON "ProductComparison"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceSimulation_userId_createdAt_idx" ON "PriceSimulation"("userId", "createdAt");

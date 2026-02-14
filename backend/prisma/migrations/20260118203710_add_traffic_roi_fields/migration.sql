-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "justification" TEXT,
ADD COLUMN     "priceRangeMax" DOUBLE PRECISION,
ADD COLUMN     "priceRangeMin" DOUBLE PRECISION,
ADD COLUMN     "productData" JSONB,
ADD COLUMN     "recommendations" JSONB,
ADD COLUMN     "suggestedPrice" DOUBLE PRECISION,
ADD COLUMN     "type" TEXT;

-- CreateIndex
CREATE INDEX "Analysis_type_idx" ON "Analysis"("type");

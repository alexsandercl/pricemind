-- CreateTable
CREATE TABLE "StoreIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT,
    "accessToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedProduct" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "suggestedPrice" DOUBLE PRECISION,
    "lastSynced" TIMESTAMP(3),
    "autoUpdate" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SyncedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION,
    "newPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreIntegration_userId_idx" ON "StoreIntegration"("userId");

-- CreateIndex
CREATE INDEX "StoreIntegration_platform_idx" ON "StoreIntegration"("platform");

-- CreateIndex
CREATE INDEX "SyncedProduct_integrationId_idx" ON "SyncedProduct"("integrationId");

-- CreateIndex
CREATE INDEX "SyncedProduct_externalId_idx" ON "SyncedProduct"("externalId");

-- CreateIndex
CREATE INDEX "SyncLog_productId_idx" ON "SyncLog"("productId");

-- CreateIndex
CREATE INDEX "SyncLog_timestamp_idx" ON "SyncLog"("timestamp");

-- AddForeignKey
ALTER TABLE "SyncedProduct" ADD CONSTRAINT "SyncedProduct_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "StoreIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SyncedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

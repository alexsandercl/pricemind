/*
  Warnings:

  - You are about to drop the column `emailNotifications` on the `UserPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `productUpdates` on the `UserPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `weeklySummary` on the `UserPreferences` table. All the data in the column will be lost.
  - You are about to drop the `Analysis` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserPreferences" DROP COLUMN "emailNotifications",
DROP COLUMN "productUpdates",
DROP COLUMN "weeklySummary";

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free';

-- DropTable
DROP TABLE "Analysis";

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

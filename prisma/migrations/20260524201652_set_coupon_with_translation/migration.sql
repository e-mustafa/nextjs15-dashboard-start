/*
  Warnings:

  - You are about to drop the column `description_ar` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `description_en` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `name_ar` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `name_en` on the `Coupon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "description_ar",
DROP COLUMN "description_en",
DROP COLUMN "name_ar",
DROP COLUMN "name_en";

-- CreateTable
CREATE TABLE "CouponTranslation" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CouponTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CouponTranslation_name_idx" ON "CouponTranslation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CouponTranslation_couponId_lang_key" ON "CouponTranslation"("couponId", "lang");

-- AddForeignKey
ALTER TABLE "CouponTranslation" ADD CONSTRAINT "CouponTranslation_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

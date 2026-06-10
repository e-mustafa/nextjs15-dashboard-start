/*
  Warnings:

  - You are about to drop the column `name_ar` on the `ProductDiscount` table. All the data in the column will be lost.
  - You are about to drop the column `name_en` on the `ProductDiscount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductDiscount" DROP COLUMN "name_ar",
DROP COLUMN "name_en";

-- CreateTable
CREATE TABLE "ProductDiscountTranslation" (
    "id" TEXT NOT NULL,
    "productDiscountId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ProductDiscountTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductDiscountTranslation_name_idx" ON "ProductDiscountTranslation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDiscountTranslation_productDiscountId_lang_key" ON "ProductDiscountTranslation"("productDiscountId", "lang");

-- AddForeignKey
ALTER TABLE "ProductDiscountTranslation" ADD CONSTRAINT "ProductDiscountTranslation_productDiscountId_fkey" FOREIGN KEY ("productDiscountId") REFERENCES "ProductDiscount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

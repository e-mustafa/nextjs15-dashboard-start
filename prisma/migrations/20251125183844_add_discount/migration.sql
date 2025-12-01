/*
  Warnings:

  - You are about to drop the column `maxQuantity` on the `ProductDiscount` table. All the data in the column will be lost.
  - You are about to drop the column `minQuantity` on the `ProductDiscount` table. All the data in the column will be lost.
  - Added the required column `name_ar` to the `ProductDiscount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_en` to the `ProductDiscount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "DiscountType" ADD VALUE 'SHIPPING';

-- AlterTable
ALTER TABLE "ProductDiscount" DROP COLUMN "maxQuantity",
DROP COLUMN "minQuantity",
ADD COLUMN     "maxDiscountValue" INTEGER,
ADD COLUMN     "minDiscountValue" INTEGER,
ADD COLUMN     "name_ar" TEXT NOT NULL,
ADD COLUMN     "name_en" TEXT NOT NULL;

/*
  Warnings:

  - The values [FIXED_AMOUNT,BUY_X_GET_Y,BUNDLE,SHIPPING] on the enum `DiscountType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('BUY_X_GET_Y', 'BUNDLE', 'SHIPPING');

-- AlterEnum
BEGIN;
CREATE TYPE "DiscountType_new" AS ENUM ('FIXED', 'PERCENTAGE');
ALTER TABLE "ProductDiscount" ALTER COLUMN "type" TYPE "DiscountType_new" USING ("type"::text::"DiscountType_new");
ALTER TYPE "DiscountType" RENAME TO "DiscountType_old";
ALTER TYPE "DiscountType_new" RENAME TO "DiscountType";
DROP TYPE "public"."DiscountType_old";
COMMIT;

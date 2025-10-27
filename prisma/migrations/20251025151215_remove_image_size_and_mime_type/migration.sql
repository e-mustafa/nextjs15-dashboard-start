/*
  Warnings:

  - You are about to drop the column `mimeType` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Image` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Image" DROP COLUMN "mimeType",
DROP COLUMN "size";

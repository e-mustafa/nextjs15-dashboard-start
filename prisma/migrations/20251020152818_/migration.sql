/*
  Warnings:

  - A unique constraint covering the columns `[brandId,lang]` on the table `BrandTranslation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "imageId" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryTranslation_name_idx" ON "public"."CategoryTranslation"("name");

-- CreateIndex
CREATE INDEX "CategoryTranslation_slug_idx" ON "public"."CategoryTranslation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_lang_key" ON "public"."CategoryTranslation"("categoryId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_lang_slug_key" ON "public"."CategoryTranslation"("lang", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "BrandTranslation_brandId_lang_key" ON "public"."BrandTranslation"("brandId", "lang");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

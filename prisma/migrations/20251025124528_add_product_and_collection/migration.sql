/*
  Warnings:

  - You are about to drop the column `seo_imageId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fileId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sku` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AttributeType" AS ENUM ('COLOR', 'SIZE', 'MATERIAL', 'STYLE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'BUNDLE');

-- DropForeignKey
ALTER TABLE "public"."Category" DROP CONSTRAINT "Category_seo_imageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- AlterTable
ALTER TABLE "public"."Brand" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."BrandTranslation" ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "seo_description" TEXT,
ADD COLUMN     "seo_keywords" TEXT,
ADD COLUMN     "seo_title" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Category" DROP COLUMN "seo_imageId",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "seo_image_id" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."CategoryTranslation" ADD COLUMN     "imageId" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Post" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "price",
ADD COLUMN     "compareAtPrice" DOUBLE PRECISION,
ADD COLUMN     "cost" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lowStockAlert" INTEGER,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaKeywords" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "sku" TEXT NOT NULL,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."ProductImage" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "imageId" TEXT,
    "seo_image_id" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionTranslation" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,

    CONSTRAINT "CollectionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionProduct" (
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionProduct_pkey" PRIMARY KEY ("collectionId","productId")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "short_description" TEXT,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "compareAtPrice" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "imageId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VariantOption" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,

    CONSTRAINT "VariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attribute" (
    "id" TEXT NOT NULL,
    "type" "public"."AttributeType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttributeTranslation" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AttributeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttributeValue" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "colorHex" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttributeValueTranslation" (
    "id" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AttributeValueTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductTag" (
    "productId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "public"."ProductDiscount" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "public"."DiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER,
    "maxQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collection_isActive_idx" ON "public"."Collection"("isActive");

-- CreateIndex
CREATE INDEX "Collection_isFeatured_idx" ON "public"."Collection"("isFeatured");

-- CreateIndex
CREATE INDEX "Collection_sortOrder_idx" ON "public"."Collection"("sortOrder");

-- CreateIndex
CREATE INDEX "CollectionTranslation_name_idx" ON "public"."CollectionTranslation"("name");

-- CreateIndex
CREATE INDEX "CollectionTranslation_slug_idx" ON "public"."CollectionTranslation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionTranslation_collectionId_lang_key" ON "public"."CollectionTranslation"("collectionId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionTranslation_lang_slug_key" ON "public"."CollectionTranslation"("lang", "slug");

-- CreateIndex
CREATE INDEX "CollectionProduct_collectionId_sortOrder_idx" ON "public"."CollectionProduct"("collectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "public"."Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "public"."Tag"("slug");

-- CreateIndex
CREATE INDEX "ProductTranslation_name_idx" ON "public"."ProductTranslation"("name");

-- CreateIndex
CREATE INDEX "ProductTranslation_slug_idx" ON "public"."ProductTranslation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_lang_key" ON "public"."ProductTranslation"("productId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_lang_slug_key" ON "public"."ProductTranslation"("lang", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "public"."ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_isActive_idx" ON "public"."ProductVariant"("isActive");

-- CreateIndex
CREATE INDEX "ProductVariant_sortOrder_idx" ON "public"."ProductVariant"("sortOrder");

-- CreateIndex
CREATE INDEX "VariantOption_variantId_idx" ON "public"."VariantOption"("variantId");

-- CreateIndex
CREATE INDEX "VariantOption_attributeId_idx" ON "public"."VariantOption"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantOption_variantId_attributeId_key" ON "public"."VariantOption"("variantId", "attributeId");

-- CreateIndex
CREATE INDEX "Attribute_type_idx" ON "public"."Attribute"("type");

-- CreateIndex
CREATE INDEX "Attribute_sortOrder_idx" ON "public"."Attribute"("sortOrder");

-- CreateIndex
CREATE INDEX "AttributeTranslation_name_idx" ON "public"."AttributeTranslation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeTranslation_attributeId_lang_key" ON "public"."AttributeTranslation"("attributeId", "lang");

-- CreateIndex
CREATE INDEX "AttributeValue_attributeId_idx" ON "public"."AttributeValue"("attributeId");

-- CreateIndex
CREATE INDEX "AttributeValue_sortOrder_idx" ON "public"."AttributeValue"("sortOrder");

-- CreateIndex
CREATE INDEX "AttributeValueTranslation_name_idx" ON "public"."AttributeValueTranslation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValueTranslation_attributeValueId_lang_key" ON "public"."AttributeValueTranslation"("attributeValueId", "lang");

-- CreateIndex
CREATE INDEX "ProductAttribute_productId_idx" ON "public"."ProductAttribute"("productId");

-- CreateIndex
CREATE INDEX "ProductAttribute_attributeId_idx" ON "public"."ProductAttribute"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_productId_attributeId_attributeValueId_key" ON "public"."ProductAttribute"("productId", "attributeId", "attributeValueId");

-- CreateIndex
CREATE INDEX "ProductTag_productId_idx" ON "public"."ProductTag"("productId");

-- CreateIndex
CREATE INDEX "ProductTag_tagId_idx" ON "public"."ProductTag"("tagId");

-- CreateIndex
CREATE INDEX "ProductDiscount_productId_idx" ON "public"."ProductDiscount"("productId");

-- CreateIndex
CREATE INDEX "ProductDiscount_startDate_endDate_idx" ON "public"."ProductDiscount"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ProductDiscount_isActive_idx" ON "public"."ProductDiscount"("isActive");

-- CreateIndex
CREATE INDEX "ProductDiscount_priority_idx" ON "public"."ProductDiscount"("priority");

-- CreateIndex
CREATE INDEX "Brand_isActive_idx" ON "public"."Brand"("isActive");

-- CreateIndex
CREATE INDEX "Brand_sortOrder_idx" ON "public"."Brand"("sortOrder");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "public"."Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "public"."Category"("isActive");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "public"."Category"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Image_fileId_key" ON "public"."Image"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "public"."Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "public"."Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "public"."Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_isFeatured_idx" ON "public"."Product"("isFeatured");

-- CreateIndex
CREATE INDEX "Product_publishedAt_idx" ON "public"."Product"("publishedAt");

-- CreateIndex
CREATE INDEX "Product_sortOrder_idx" ON "public"."Product"("sortOrder");

-- CreateIndex
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "public"."ProductImage"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductImage_productId_isPrimary_idx" ON "public"."ProductImage"("productId", "isPrimary");

-- AddForeignKey
ALTER TABLE "public"."BrandTranslation" ADD CONSTRAINT "BrandTranslation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_seo_image_id_fkey" FOREIGN KEY ("seo_image_id") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_seo_image_id_fkey" FOREIGN KEY ("seo_image_id") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionTranslation" ADD CONSTRAINT "CollectionTranslation_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionProduct" ADD CONSTRAINT "CollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionProduct" ADD CONSTRAINT "CollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariantOption" ADD CONSTRAINT "VariantOption_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariantOption" ADD CONSTRAINT "VariantOption_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "public"."Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariantOption" ADD CONSTRAINT "VariantOption_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "public"."AttributeValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttributeTranslation" ADD CONSTRAINT "AttributeTranslation_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "public"."Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttributeValue" ADD CONSTRAINT "AttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "public"."Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttributeValueTranslation" ADD CONSTRAINT "AttributeValueTranslation_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "public"."AttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "public"."Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "public"."AttributeValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTag" ADD CONSTRAINT "ProductTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductDiscount" ADD CONSTRAINT "ProductDiscount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

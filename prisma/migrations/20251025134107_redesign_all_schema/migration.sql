/*
  Warnings:

  - You are about to drop the column `imageId` on the `BrandTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_description` on the `BrandTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_keywords` on the `BrandTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_title` on the `BrandTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_image_id` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `CategoryTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_description` on the `CategoryTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_keywords` on the `CategoryTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_title` on the `CategoryTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_image_id` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `seo_description` on the `CollectionTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_keywords` on the `CollectionTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `seo_title` on the `CollectionTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `short_description` on the `ProductTranslation` table. All the data in the column will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Authenticator" DROP CONSTRAINT "Authenticator_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BrandTranslation" DROP CONSTRAINT "BrandTranslation_imageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Category" DROP CONSTRAINT "Category_seo_image_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."CategoryTranslation" DROP CONSTRAINT "CategoryTranslation_imageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Collection" DROP CONSTRAINT "Collection_seo_image_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductImage" DROP CONSTRAINT "ProductImage_imageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_imageId_fkey";

-- DropIndex
DROP INDEX "public"."BrandTranslation_slug_idx";

-- DropIndex
DROP INDEX "public"."CategoryTranslation_slug_idx";

-- DropIndex
DROP INDEX "public"."CollectionTranslation_slug_idx";

-- DropIndex
DROP INDEX "public"."ProductTranslation_slug_idx";

-- AlterTable
ALTER TABLE "public"."Brand" ADD COLUMN     "seoImageId" TEXT;

-- AlterTable
ALTER TABLE "public"."BrandTranslation" DROP COLUMN "imageId",
DROP COLUMN "seo_description",
DROP COLUMN "seo_keywords",
DROP COLUMN "seo_title",
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoKeywords" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "public"."Category" DROP COLUMN "seo_image_id",
ADD COLUMN     "seoImageId" TEXT;

-- AlterTable
ALTER TABLE "public"."CategoryTranslation" DROP COLUMN "imageId",
DROP COLUMN "seo_description",
DROP COLUMN "seo_keywords",
DROP COLUMN "seo_title",
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoKeywords" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "public"."Collection" DROP COLUMN "seo_image_id",
ADD COLUMN     "seoImageId" TEXT;

-- AlterTable
ALTER TABLE "public"."CollectionTranslation" DROP COLUMN "seo_description",
DROP COLUMN "seo_keywords",
DROP COLUMN "seo_title",
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoKeywords" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "public"."Image" ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "seoImageId" TEXT;

-- AlterTable
ALTER TABLE "public"."ProductDiscount" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."ProductTranslation" DROP COLUMN "short_description",
ADD COLUMN     "shortDescription" TEXT;

-- AlterTable
ALTER TABLE "public"."ProductVariant" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "public"."accounts";

-- DropTable
DROP TABLE "public"."sessions";

-- DropTable
DROP TABLE "public"."users";

-- DropTable
DROP TABLE "public"."verification_tokens";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "password" TEXT,
    "imageId" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BrandImage" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BrandImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CategoryImage" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CategoryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionImage" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CollectionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "BrandImage_brandId_sortOrder_idx" ON "public"."BrandImage"("brandId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BrandImage_brandId_imageId_key" ON "public"."BrandImage"("brandId", "imageId");

-- CreateIndex
CREATE INDEX "CategoryImage_categoryId_sortOrder_idx" ON "public"."CategoryImage"("categoryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryImage_categoryId_imageId_key" ON "public"."CategoryImage"("categoryId", "imageId");

-- CreateIndex
CREATE INDEX "CollectionImage_collectionId_sortOrder_idx" ON "public"."CollectionImage"("collectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionImage_collectionId_imageId_key" ON "public"."CollectionImage"("collectionId", "imageId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Brand" ADD CONSTRAINT "Brand_seoImageId_fkey" FOREIGN KEY ("seoImageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandImage" ADD CONSTRAINT "BrandImage_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandImage" ADD CONSTRAINT "BrandImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_seoImageId_fkey" FOREIGN KEY ("seoImageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryImage" ADD CONSTRAINT "CategoryImage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryImage" ADD CONSTRAINT "CategoryImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_seoImageId_fkey" FOREIGN KEY ("seoImageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionImage" ADD CONSTRAINT "CollectionImage_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionImage" ADD CONSTRAINT "CollectionImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_seoImageId_fkey" FOREIGN KEY ("seoImageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

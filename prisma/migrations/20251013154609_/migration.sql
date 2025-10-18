-- DropForeignKey
ALTER TABLE "public"."BrandTranslation" DROP CONSTRAINT "BrandTranslation_brandId_fkey";

-- CreateIndex
CREATE INDEX "BrandTranslation_name_idx" ON "public"."BrandTranslation"("name");

-- CreateIndex
CREATE INDEX "BrandTranslation_slug_idx" ON "public"."BrandTranslation"("slug");

-- AddForeignKey
ALTER TABLE "public"."BrandTranslation" ADD CONSTRAINT "BrandTranslation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

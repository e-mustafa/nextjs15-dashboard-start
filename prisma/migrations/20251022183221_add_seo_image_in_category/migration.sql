-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "seo_imageId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_seo_imageId_fkey" FOREIGN KEY ("seo_imageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

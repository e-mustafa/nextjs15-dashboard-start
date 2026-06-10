import { TImage } from '@/types/api';
import { TBrandFormValues } from '@/validation/brand-validation';
import { Prisma } from '@prisma/client';
import { BRAND_COMPLETE_INCLUDE } from './utils';

export type TFormValues = TBrandFormValues;

export type BrandWithRelations = Prisma.BrandGetPayload<{
	include: typeof BRAND_COMPLETE_INCLUDE;
}>;

export type BrandProduct = {
	id: string;
	name: string;
	image?: string;
};

export type Brand = {
	id: string;
	name: string;
	description?: string;
	slug?: string;
	isActive: boolean;
	seoTitle?: string;
	seoDescription?: string;
	seoKeywords?: string;
	createdAt?: string;
	updatedAt?: string;
	images?: TImage[];
	seoImage?: TImage;
	products: BrandProduct[];
};

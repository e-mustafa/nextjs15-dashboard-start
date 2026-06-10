import { TImage } from '@/types/api';
import { TCategoryFormValues } from '@/validation/category-validation';
import { Prisma } from '@prisma/client';
import { CATEGORY_COMPLETE_INCLUDE } from './utils';

export type TFormValues = TCategoryFormValues;

export type CategoryWithRelations = Prisma.CategoryGetPayload<{
	include: typeof CATEGORY_COMPLETE_INCLUDE;
}>;

export interface CategoryProduct {
	id: string;
	name: string;
	image?: string;
}

export type Category = {
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
	products: [];
};

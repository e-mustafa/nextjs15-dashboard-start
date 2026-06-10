import { TImage } from '@/types/api';
import { TCollectionFormValues } from '@/validation/collection-validation';
import { Prisma } from '@prisma/client';
import { COLLECTION_COMPLETE_INCLUDE } from './utils';

export type TFormValues = TCollectionFormValues;

export type CollectionWithRelations = Prisma.CollectionGetPayload<{
	include: typeof COLLECTION_COMPLETE_INCLUDE;
}>;

export type Collection = {
	id: string;
	name: string;
	description?: string;
	slug?: string;
	isActive: boolean;
	isFeatured: boolean;
	sortOrder: number;
	seoTitle?: string;
	seoDescription?: string;
	seoKeywords?: string;
	createdAt?: string;
	updatedAt?: string;
	images?: TImage[];
	seoImage?: TImage;
	products: string[];
};

export type CollectionProduct = {
	id: string;
	name: string;
	image?: string;
};

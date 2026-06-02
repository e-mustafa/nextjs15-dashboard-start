import { TImage } from '@/types/api';
import { DiscountType, Prisma } from '@prisma/client';
import { discountWithRelationsInclude } from './prisma-includes.js';

// Extract the typescript type directly from Prisma payload based on the share include
export type DiscountWithRelations = Prisma.ProductDiscountGetPayload<{
	include: typeof discountWithRelationsInclude;
}>;

// ✅ Type product for discount
export interface DiscountProduct {
	id: string;
	name: string;
	basePrice: number;
	finalPrice: number;
	discountAmount: number;
	discountPercentage: number;
	images?: TImage[];
	image?: string;
}

export interface FormattedDiscount {
	id: string;
	name?: string;
	type: DiscountType;
	value: number;
	startDate: string;
	endDate: string | null;
	isActive: boolean;
	priority: number;
	minDiscountValue: number | null;
	maxDiscountValue: number | null;
	createdAt: string;
	updatedAt: string;
	products: string[];
	discountProducts: DiscountProduct[];
	totalProducts: number;
}

export interface ProductWithDiscount {
	id: string;
	name: string;
	sku: string;
	slug: string;
	basePrice: number;
	compareAtPrice: number | null;
	finalPrice: number;
	discountAmount: number;
	discountPercentage: number;
	hasDiscount: boolean;
	activeDiscount: ActiveDiscountInfo | null;
}

export interface ActiveDiscountInfo {
	id: string;
	type: DiscountType;
	value: number;
	name_ar: string;
	name_en: string;
	startDate: string;
	endDate: string | null;
	priority: number;
}

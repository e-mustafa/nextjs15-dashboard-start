import { TImage } from '@/types/api';
import { DiscountType, Prisma, ProductType } from '@prisma/client';
import { PRODUCT_COMPLETE_INCLUDE } from './prisma-includes';
import { IInitialItems } from '@/validation/fields-validation.js';

/////////////////////////
// TYPES
/////////////////////////

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_COMPLETE_INCLUDE }>;

export interface SpecificationProperty {
	id?: string;
	key_ar: string;
	key_en: string;
	value_ar: string;
	value_en: string;
}

export interface SpecificationSection {
	id?: string;
	title_ar: string;
	title_en: string;
	properties: SpecificationProperty[];
	// isEditing?: boolean;
}

export interface TDiscount {
	id: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	type: DiscountType;
	// name_ar: string;
	// name_en: string;
	value: number;
	startDate: Date;
	endDate: Date | null;
	priority: number;
	minDiscountValue: number | null;
	maxDiscountValue: number | null;
}
export interface TProduct {
	id: string;
	sku: string;
	name?: string;
	slug?: string;
	description?: string;
	shortDescription?: string;
	brandId?: string | null;
	categoryId?: string | null;
	basePrice: number;
	compareAtPrice?: number | null;
	cost?: number | null;
	stockQuantity: number;
	lowStockAlert?: number | null;
	trackInventory: boolean;
	// keepSelling: boolean;
	isActive: boolean;
	isFeatured: boolean;
	sortOrder: number;
	type: ProductType;
	weight?: number | null;
	length?: number | null;
	width?: number | null;
	height?: number | null;
	images?: TImage[];
	seoImage?: TImage[];
	seoTitle?: string;
	seoDescription?: string;
	seoKeywords?: string;
	createdAt?: string | Date;
	updatedAt?: string | Date;
	// brand?: { id: string; name: string; image?: TImage };
	// category?: { id: string; name: string; image?: TImage };
	// collections?: Array<{ id: string; name: string; image?: TImage }>;
	brand?: string;
	category?: string;
	collections?: string[];
	variants?: ProductVariant[];
	specifications?: SpecificationSection[];

	// for preload item in
	initialItems: IInitialItems;
	
	// {
	// 	brands?: Array<{ id: string; name: string; image?: string }>;
	// 	categories?: Array<{ id: string; name: string; image?: string }>;
	// 	collections?: Array<{ id: string; name: string; image?: string }>;
	// 	tags: Array<{ id: string; name: string }>;
	// };

	discounts?: TDiscount[];

	finalPrice?: number;
	discountAmount?: number;
	discountPercentage?: number;
	hasDiscount?: boolean;
	activeDiscount?: {
		id: string;
		type: DiscountType;
		value: number;
		// name_ar: string;
		// name_en: string;
		startDate: string;
		endDate: string | null;
	} | null;
}

interface ProductVariant {
	id: string;
	sku: string;
	price?: number | null;
	compareAtPrice?: number | null;
	cost?: number | null;
	stockQuantity: number;
	isActive: boolean;
	imageId?: string | null;
	images?: TImage[];
	options: Array<{
		attributeId: string;
		attributeValueId: string;
		attribute: { name_ar: string; name_en: string };
		attributeValue: { value_ar: string; value_en: string; colorHex?: string | null };
	}>;
}


export type OptionProduct = {
	price: number;
	name: string;
	image: string;
	isActive: boolean;
	id: string;
	basePrice: number;
	createdAt: Date;
	compareAtPrice: number | null;
	stockQuantity: number;
	discountAmount?: number;
	priceAfterDiscount?: number;
};
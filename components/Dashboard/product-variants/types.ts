// -----------------------------
// TYPES - Updated to match Backend Schema
// -----------------------------

import { TImage } from '@/types/api';

/**
 * Attribute from backend (matches Prisma schema)
 */
export type AttributeBackend = {
	id: string;
	type: 'COLOR' | 'SIZE' | 'MATERIAL' | 'STYLE' | 'CUSTOM';
	translations: {
		id: string;
		lang: string;
		name: string;
	}[];
	values: {
		id: string;
		value: string;
		colorHex?: string;
		translations: {
			id: string;
			lang: string;
			name: string;
		}[];
	}[];
};

/**
 * Variant from backend (matches ProductVariant schema)
 */
export type VariantBackend = {
	id: string;
	sku: string;
	price?: number;
	compareAtPrice?: number;
	cost?: number;
	stockQuantity: number;
	imageId?: string;
	image?: {
		id: string;
		url: string;
		fileId: string;
	};
	isActive: boolean;
	options: {
		id: string;
		attributeId: string;
		attributeValueId: string;
		attribute: {
			id: string;
			type: string;
			translations: { lang: string; name: string }[];
		};
		attributeValue: {
			id: string;
			value: string;
			colorHex?: string;
			translations: { lang: string; name: string }[];
		};
	}[];
};

/**
 * Form types for Frontend
 */
export type VariantOption = {
	id: string;
	value_ar: string;
	value_en: string;
	attributeValueId?: string; // Backend reference
	colorHex?: string;
};

export type VariantForm = {
	id: string;
	attributeId?: string; // Backend reference
	title_ar: string;
	title_en: string;
	options: VariantOption[];
	isEditing?: boolean;
};

export type CombinationAttribute = {
	attributeId: string;
	attributeValueId: string;
	name_ar: string;
	name_en: string;
	value_ar: string;
	value_en: string;
	colorHex?: string;
};

export type Combination = {
	id: string;
	variantId?: string;
	sku?: string;
	attributes: CombinationAttribute[];
	price: string | number;
	compareAtPrice?: string | number;
	cost?: string | number;
	qty: number;
	images?: TImage[];
	imageId?: string;
	checked: boolean;
	isActive?: boolean;
};

export type GroupedCombination = {
	title: string;
	title_ar: string;
	title_en: string;
	attributes: CombinationAttribute[];
	checked: boolean;
	price: string | number;
	qty: number;
	images?: TImage[];
	items: Combination[];
};

export type ProductVariantsForm = {
	variants: VariantForm[];
	combinations: Combination[];
};

/**
 * Product form data (for submission)
 */
export type ProductFormData = {
	// ... other product fields
	variants?: {
		sku: string;
		price?: number;
		compareAtPrice?: number;
		cost?: number;
		stockQuantity: number;
		imageId?: string;
		isActive: boolean;
		options: {
			attributeId: string;
			attributeValueId: string;
		}[];
	}[];
};

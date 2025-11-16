// -----------------------------
// UTILITIES - Fixed & Optimized
// -----------------------------

import { TImage } from '@/types/api';
import {
	AttributeBackend,
	Combination,
	CombinationAttribute,
	GroupedCombination,
	ProductVariantsForm,
	VariantBackend,
	VariantForm,
} from './types';

/**
 * Generate unique ID
 */
export const generateId = (prefix?: string): string => {
	try {
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			const uuid = crypto.randomUUID();
			return prefix ? `${prefix}-${uuid}` : uuid;
		}
	} catch (e) {
		// Fallback
	}
	const randomPart = Math.random().toString(36).substr(2, 9);
	return prefix ? `${prefix}-${randomPart}` : `${Date.now()}-${randomPart}`;
};

/**
 * Generate SKU for variant
 */
export const generateSKU = (baseSKU: string, attributes: CombinationAttribute[], index?: number): string => {
	if (attributes.length === 0) {
		return `${baseSKU}-${index || 1}`;
	}

	const parts = attributes.map((attr) => {
		const value = attr.value_en || attr.value_ar;
		// Take first 3 chars of each value
		return value.substring(0, 3).toUpperCase();
	});

	return `${baseSKU}-${parts.join('-')}`;
};

/**
 * Generate all combinations (Cartesian product)
 * Fixed: Properly handles empty options and generates correct combinations
 */
export const generateCombinations = (variants: VariantForm[], baseSKU?: string): Combination[] => {
	console.log('🔧 generateCombinations called with:', {
		variantsCount: variants.length,
		baseSKU,
		variants: variants.map((v) => ({
			title_ar: v.title_ar,
			title_en: v.title_en,
			optionsCount: v.options?.length,
			isEditing: v.isEditing,
		})),
	});

	// Filter valid variants
	const validVariants = variants.filter(
		(v) =>
			(v.title_ar || v.title_en) &&
			v.options &&
			v.options.length > 0 &&
			v.options.some((opt) => opt.value_ar || opt.value_en)
	);

	console.log('✅ Valid variants:', validVariants.length);

	if (validVariants.length === 0) {
		console.log('❌ No valid variants found');
		return [];
	}

	// Recursive function
	const combine = (index: number, current: CombinationAttribute[]): Combination[] => {
		if (index === validVariants.length) {
			const sku = baseSKU ? generateSKU(baseSKU, current, index) : undefined;

			return [
				{
					id: generateId(),
					sku,
					attributes: [...current],
					price: '',
					qty: 0,
					checked: true,
					isActive: true,
				},
			];
		}

		const results: Combination[] = [];
		const variant = validVariants[index];

		const validOptions = variant.options.filter((opt) => opt.value_ar || opt.value_en);

		console.log(`📦 Processing variant ${index}:`, {
			title: variant.title_ar || variant.title_en,
			validOptions: validOptions.length,
		});

		for (const option of validOptions) {
			const newAttribute: CombinationAttribute = {
				attributeId: variant.attributeId || '',
				attributeValueId: option.attributeValueId || '',
				name_ar: variant.title_ar || '',
				name_en: variant.title_en || '',
				value_ar: option.value_ar || '',
				value_en: option.value_en || '',
				colorHex: option.colorHex,
			};

			results.push(...combine(index + 1, [...current, newAttribute]));
		}

		return results;
	};

	const result = combine(0, []);
	console.log('✨ Generated combinations:', result.length);

	return result;
};

/**
 * Group combinations by specific attribute
 * Fixed: Better grouping logic with proper title handling
 */
export const groupCombinationsBy = (combinations: Combination[], groupByTitle?: string): GroupedCombination[] => {
	if (!groupByTitle || !combinations || combinations.length === 0) {
		return [];
	}

	const grouped: Record<string, GroupedCombination> = {};

	combinations.forEach((combo) => {
		// Find the attribute to group by
		const groupAttr = combo.attributes.find((attr) => `${attr.name_ar} - ${attr.name_en}` === groupByTitle);

		if (!groupAttr) return;

		const key = `${groupAttr.value_ar} - ${groupAttr.value_en}`;

		if (!grouped[key]) {
			grouped[key] = {
				title: key,
				title_ar: groupAttr.value_ar,
				title_en: groupAttr.value_en,
				attributes: [groupAttr],
				checked: combo.checked,
				price: combo.price,
				qty: 0,
				images: combo.images,
				items: [],
			};
		}

		grouped[key].items.push(combo);
		grouped[key].qty += combo.qty || 0;
		grouped[key].checked = grouped[key].checked && combo.checked;
	});

	// Set uniform price if all items have same price
	Object.values(grouped).forEach((group) => {
		const prices = new Set(group.items.map((item) => String(item.price)));
		group.price = prices.size === 1 ? [...prices][0] : '';

		// If only one variant level, no need for nested items
		if (combinations[0]?.attributes?.length === 1) {
			group.items = [];
		}
	});

	return Object.values(grouped);
};

/**
 * Normalize backend data to form format
 * Fixed: Properly handles backend structure with translations
 */
export const normalizeBackendToForm = (
	backendVariants: VariantBackend[],
	availableAttributes: AttributeBackend[]
): ProductVariantsForm => {
	if (!backendVariants || backendVariants.length === 0) {
		return { variants: [], combinations: [] };
	}

	console.log('backendVariants', backendVariants);

	// Build variants map from existing combinations
	const variantsMap = new Map<string, VariantForm>();
	const combinations: Combination[] = [];

	backendVariants.forEach((variant) => {
		// Process each variant option
		variant?.options?.forEach((option) => {
			const attrId = option?.attributeId;

			// Get or create variant form for this attribute
			if (!variantsMap.has(attrId)) {
				const arTranslation = option?.attribute?.translations?.find((t) => t.lang === 'ar');
				const enTranslation = option?.attribute?.translations?.find((t) => t.lang === 'en');

				variantsMap.set(attrId, {
					id: generateId(),
					attributeId: attrId,
					title_ar: arTranslation?.name || '',
					title_en: enTranslation?.name || '',
					options: [],
					isEditing: arTranslation?.name || enTranslation?.name ? false : true,
				});
			}

			// Add option if not exists
			const variantForm = variantsMap.get(attrId)!;
			const valueId = option.attributeValueId;

			if (!variantForm.options.some((o) => o.attributeValueId === valueId)) {
				const arValueTranslation = option?.attributeValue?.translations?.find((t) => t.lang === 'ar');
				const enValueTranslation = option?.attributeValue?.translations?.find((t) => t.lang === 'en');

				variantForm.options.push({
					id: generateId(),
					attributeValueId: valueId,
					value_ar: arValueTranslation?.name || option?.attributeValue?.value,
					value_en: enValueTranslation?.name || option?.attributeValue?.value,
					colorHex: option?.attributeValue?.colorHex,
				});
			}
		});

		// Build combination
		const attributes: CombinationAttribute[] = variant.options.map((option) => {
			const arAttrTranslation = option?.attribute?.translations?.find((t) => t.lang === 'ar');
			const enAttrTranslation = option?.attribute?.translations?.find((t) => t.lang === 'en');
			const arValueTranslation = option?.attributeValue?.translations?.find((t) => t.lang === 'ar');
			const enValueTranslation = option?.attributeValue?.translations?.find((t) => t.lang === 'en');

			return {
				attributeId: option.attributeId,
				attributeValueId: option.attributeValueId,
				name_ar: arAttrTranslation?.name || '',
				name_en: enAttrTranslation?.name || '',
				value_ar: arValueTranslation?.name || option?.attributeValue?.value,
				value_en: enValueTranslation?.name || option?.attributeValue?.value,
				colorHex: option?.attributeValue?.colorHex,
			};
		});

		combinations.push({
			id: generateId(),
			variantId: variant.id,
			sku: variant.sku,
			attributes,
			price: variant.price || '',
			compareAtPrice: variant.compareAtPrice || '',
			cost: variant.cost || '',
			qty: variant.stockQuantity || 0,
			images: variant.image ? [{ url: variant.image.url, fileId: variant.image.fileId }] : [],
			imageId: variant.imageId,
			checked: variant.isActive,
			isActive: variant.isActive,
		});
	});

	return {
		variants: Array.from(variantsMap.values()),
		combinations,
	};
};

/**
 * Convert form data to backend format
 */
export const formatVariantsForBackend = (
	formData: ProductVariantsForm,
	productSKU: string
): {
	sku: string;
	price?: number;
	compareAtPrice?: number;
	cost?: number;
	stockQuantity: number;
	images?: TImage[];
	isActive: boolean;
	options: {
		attributeId: string;
		attributeValueId: string;
	}[];
}[] => {
	return formData.combinations
		.filter((combo) => combo.checked)
		.map((combo, index) => ({
			sku: combo.sku || generateSKU(productSKU, combo.attributes, index + 1),
			price: combo.price ? Number(combo.price) : undefined,
			compareAtPrice: combo.compareAtPrice ? Number(combo.compareAtPrice) : undefined,
			cost: combo.cost ? Number(combo.cost) : undefined,
			stockQuantity: combo.qty || 0,
			images: combo.images,
			isActive: combo.isActive ?? true,
			options: combo.attributes.map((attr) => ({
				attributeId: attr.attributeId,
				attributeValueId: attr.attributeValueId,
			})),
		}));
};

/**
 * Get translation helper
 */
export const getTranslation = (translations: { lang: string; name: string }[], lang: 'ar' | 'en'): string => {
	return translations.find((t) => t.lang === lang)?.name || '';
};

/**
 * Calculate totals for combinations
 */
export const calculateTotals = (
	combinations: Combination[]
): {
	total: number;
	checked: number;
	totalQty: number;
	totalValue: number;
} => {
	const checked = combinations.filter((c) => c.checked).length;
	const totalQty = combinations.filter((c) => c.checked).reduce((sum, c) => +sum + (+c.qty || 0), 0);
	const totalValue = combinations
		.filter((c) => c.checked)
		.reduce((sum, c) => sum + (Number(c.price) || 0) * (c.qty || 0), 0);

	return {
		total: combinations.length,
		checked,
		totalQty,
		totalValue,
	};
};

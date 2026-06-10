import { calculateSingleProductDiscount, MinimalCouponData } from '@/lib/calculate-coupon-discounted-price';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { fields, TCouponFormValues } from '@/validation/coupon-validation';
import { CouponApplicableOn } from '@prisma/client';
import { CouponCategory, CouponCollection, CouponProduct, CouponWithRelations, FormattedCoupon } from './types';

/** 🔹 Format Single Product for Coupon */
export async function formatCouponProduct(
	productRelation: CouponWithRelations['products'][0],
	locale?: string,
	couponData?: MinimalCouponData,
): Promise<CouponProduct> {
	const { product } = productRelation;

	let productName = '';
	if (product.translations?.length > 0) {
		const productTranslation = await mapTranslations(product.translations, {
			accept_language: locale,
			fields: ['name'],
			enableFallback: true,
		});
		productName = (productTranslation as { name?: string }).name || '';
	}

	const firstImage = product.images?.[0]?.image?.url || undefined;

	let discountInfo = {};
	if (couponData) {
		discountInfo = calculateSingleProductDiscount(product.basePrice, couponData);
	}

	console.log('product.id', product.id);

	return {
		id: product.id,
		name: productName,
		basePrice: product.basePrice,
		image: firstImage,
		stockQuantity: product.stockQuantity,
		...discountInfo,
	};
}

/** 🔹 Format Single Category for Coupon */
export async function formatCouponCategory(
	categoryRelation: CouponWithRelations['categories'][0],
	locale?: string,
): Promise<CouponCategory> {
	const { category } = categoryRelation;

	let categoryName = '';
	if (category.translations?.length > 0) {
		const categoryTranslation = await mapTranslations(category.translations, {
			accept_language: locale,
			fields: ['name'],
			enableFallback: true,
		});
		categoryName = (categoryTranslation as { name?: string }).name || '';
	}

	const firstImage = category.images?.[0]?.image?.url || undefined;

	return {
		id: category.id,
		name: categoryName,
		image: firstImage,
	};
}

/** 🔹 Format Single Collection for Coupon */
export async function formatCouponCollection(
	collectionRelation: CouponWithRelations['collections'][0],
	locale?: string,
): Promise<CouponCollection> {
	const { collection } = collectionRelation;

	let collectionName = '';
	if (collection.translations?.length > 0) {
		const collectionTranslation = await mapTranslations(collection.translations, {
			accept_language: locale,
			fields: ['name'],
			enableFallback: true,
		});
		collectionName = (collectionTranslation as { name?: string }).name || '';
	}

	const firstImage = collection.images?.[0]?.image?.url || undefined;

	return {
		id: collection.id,
		name: collectionName,
		image: firstImage,
	};
}

export async function handleCouponData(coupon: CouponWithRelations, locale?: string) {
	const {
		products,
		categories,
		collections,
		translations,
		startDate,
		endDate,
		createdAt,
		updatedAt,
		type,
		value,
		maxDiscountAmount,
		...rest
	} = coupon;

	// Format products, categories, collections (full objects for initialItems)
	let formattedProducts: CouponProduct[] = [];
	let formattedCategories: CouponCategory[] = [];
	let formattedCollections: CouponCollection[] = [];
	if (products) {
		formattedProducts = await Promise.all(
			products.map((p) => formatCouponProduct(p, locale, { type, value, maxDiscountAmount })),
		);
	}
	if (categories) {
		formattedCategories = await Promise.all(categories.map((c) => formatCouponCategory(c, locale)));
	}
	if (collections) {
		formattedCollections = await Promise.all(collections.map((c) => formatCouponCollection(c, locale)));
	}

	// Check validity
	const now = new Date();
	const isExpired = endDate ? now > endDate : false;
	const isStarted = now >= startDate;
	const hasUsesLeft = rest.usageLimit ? rest.usedCount < rest.usageLimit : true;
	const isValid = rest.isActive && isStarted && !isExpired && hasUsesLeft;
	const remainingUses = rest.usageLimit ? rest.usageLimit - rest.usedCount : null;

	return {
		...rest,
		type,
		value,
		maxDiscountAmount,
		startDate: startDate.toISOString(),
		endDate: endDate ? endDate.toISOString() : null,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
		remainingUses,
		isValid,
		isExpired,
		// ✅ IDs for form values
		products: products?.map((p) => p.product.id),
		categories: categories?.map((c) => c.category.id),
		collections: collections?.map((c) => c.collection.id),
		totalProducts: products?.length || 0,
		totalCategories: categories?.length || 0,
		totalCollections: collections?.length || 0,
		// ✅ Full objects for display and initial form values in combobox
		initialItems: {
			products: formattedProducts,
			categories: formattedCategories,
			collections: formattedCollections,
		},
	};
}

/** 🔹 Format Coupon (for listing/display) */
export async function formatCoupon(coupon: CouponWithRelations, locale?: string): Promise<FormattedCoupon> {
	// Get translations
	const translationData = await mapTranslations(coupon?.translations, {
		accept_language: locale,
		fields,
		enableFallback: true,
	});

	const couponData = await handleCouponData(coupon, locale);

	return {
		name: translationData?.name || '',
		description: translationData?.description,
		...couponData,
	};
}

/** 🔹 Format Coupon for Edit Form */
export async function formatCouponForEdit(coupon: CouponWithRelations, locale?: string): Promise<TCouponFormValues> {
	const { translations } = coupon;

	// Get translations for edit (both languages)
	const translationData = await mapTranslations(translations, {
		accept_language: '*', // Get all languages
		fields,
		enableFallback: false,
	});

	const couponData = await handleCouponData(coupon, locale);

	return {
		name_ar: translationData.name_ar || '',
		name_en: translationData.name_en || '',
		description_ar: translationData.description_ar || '',
		description_en: translationData.description_en || '',
		...couponData,
	};
}

/** 🔹 Check Coupon Applicability */
export async function checkCouponApplicability(
	coupon: {
		applicableOn: CouponApplicableOn;
		products: { productId: string }[];
		categories: { categoryId: string }[];
		collections: { collectionId: string }[];
	},
	cartItems: { productId: string; categoryId?: string; collectionIds?: string[] }[],
): Promise<boolean> {
	switch (coupon.applicableOn) {
		case CouponApplicableOn.ALL_PRODUCTS:
			return true;
		case CouponApplicableOn.SPECIFIC_PRODUCTS:
			return cartItems.some((item) => coupon.products.some((p) => p.productId === item.productId));
		case CouponApplicableOn.SPECIFIC_CATEGORIES:
			return cartItems.some((item) => item.categoryId && coupon.categories.some((c) => c.categoryId === item.categoryId));
		case CouponApplicableOn.SPECIFIC_COLLECTIONS:
			return cartItems.some((item) =>
				item.collectionIds?.some((cid) => coupon.collections.some((c) => c.collectionId === cid)),
			);
		case CouponApplicableOn.MINIMUM_PURCHASE:
			return true;
		default:
			return false;
	}
}

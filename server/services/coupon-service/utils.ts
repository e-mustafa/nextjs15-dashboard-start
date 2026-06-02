import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { TCouponFormValues, fields } from '@/validation/coupon-validation';
import { CouponCategory, CouponCollection, CouponProduct, CouponValidation, CouponWithRelations, FormattedCoupon } from './types';
import { logger } from '@/lib/logs/logger.js';
import { AppError } from '@/lib/error-handler/error-handler.server.js';
import { CouponApplicableOn } from '@prisma/client';
import { ActionResult } from '@/types/api.js';

/** 🔹 Format Single Product for Coupon */
export async function formatCouponProduct(
	productRelation: CouponWithRelations['products'][0],
	locale?: string,
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

	return {
		id: product.id,
		name: productName,
		basePrice: product.basePrice,
		image: firstImage,
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
	const { products, categories, collections, startDate, endDate, createdAt, updatedAt, ...rest } = coupon;

	// Format products, categories, collections (full objects for initialItems)
	const formattedProducts = await Promise.all(products.map((p) => formatCouponProduct(p, locale)));
	const formattedCategories = await Promise.all(categories.map((c) => formatCouponCategory(c, locale)));
	const formattedCollections = await Promise.all(collections.map((c) => formatCouponCollection(c, locale)));

	// Check validity
	const now = new Date();
	const isExpired = endDate ? now > endDate : false;
	const isStarted = now >= startDate;
	const hasUsesLeft = rest.usageLimit ? rest.usedCount < rest.usageLimit : true;
	const isValid = rest.isActive && isStarted && !isExpired && hasUsesLeft;
	const remainingUses = rest.usageLimit ? rest.usageLimit - rest.usedCount : null;

	return {
		...rest,
		startDate: startDate.toISOString(),
		endDate: endDate ? endDate.toISOString() : null,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
		remainingUses,
		isValid,
		isExpired,
		// ✅ IDs for form values
		products: formattedProducts.map((p) => p.id),
		categories: formattedCategories.map((c) => c.id),
		collections: formattedCollections.map((c) => c.id),
		totalProducts: formattedProducts.length,
		totalCategories: formattedCategories.length,
		totalCollections: formattedCollections.length,
		// ✅ Full objects for display
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

	console.log('translations--', translations);

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
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { prisma_DB } from '@/prisma/prisma.db';
import { TDiscountFormValues } from '@/validation/discount-validation';
import { DiscountType, Prisma } from '@prisma/client';
import { calculateDiscountedPrice } from '../utils';
import { DiscountWithRelations } from './prisma-includes';
import { DiscountProduct, FormattedDiscount } from './types';

/** * Format Single Product for Discount
 */
export async function formatDiscountProduct(
	productRelation: DiscountWithRelations['products'][0],
	discountType: DiscountType,
	discountValue: number,
	minDiscountValue: number | null,
	maxDiscountValue: number | null,
	acceptLanguage?: string,
): Promise<DiscountProduct> {
	const { product } = productRelation;
	const locale = await getCurrentLocale();

	let productName = '';
	if (product.translations && product.translations.length > 0) {
		const productTranslation = await mapTranslations(product.translations, {
			accept_language: acceptLanguage && acceptLanguage !== '*' ? acceptLanguage : locale,
			fields: ['name'],
			enableFallback: true,
		});
		productName = (productTranslation as { name?: string }).name || '';
	}

	const finalPrice = await calculateDiscountedPrice(product.basePrice, {
		type: discountType,
		value: discountValue,
		minDiscountValue,
		maxDiscountValue,
	});

	const discountAmount = product.basePrice - finalPrice;
	const discountPercentage = Math.round((discountAmount / product.basePrice) * 100);
	const firstImage = product.images && product.images.length > 0 ? product.images[0].image?.url || '' : undefined;

	return {
		id: product.id,
		name: productName,
		basePrice: product.basePrice,
		finalPrice,
		discountAmount,
		discountPercentage,
		image: firstImage,
	};
}

/** * Handle core formatting logic for discounts
 */
export async function handleFormatDiscount(discount: DiscountWithRelations, acceptLanguage?: string): Promise<FormattedDiscount> {
	const { products, startDate, endDate, createdAt, updatedAt, ...rest } = discount;

	const formattedProducts = await Promise.all(
		products.map((productRelation) =>
			formatDiscountProduct(
				productRelation,
				discount.type,
				discount.value,
				discount.minDiscountValue,
				discount.maxDiscountValue,
				acceptLanguage,
			),
		),
	);

	return {
		...rest,
		startDate: startDate.toISOString(),
		endDate: endDate ? endDate.toISOString() : null,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
		products: products?.map((e) => e.productId),
		discountProducts: formattedProducts,
		totalProducts: formattedProducts.length,
	};
}

/** * Format discount with multi-language data
 */
export async function formatDiscount(discount: DiscountWithRelations, acceptLanguage?: string): Promise<FormattedDiscount> {
	const translationData = await mapTranslations(discount?.translations, {
		accept_language: acceptLanguage,
		fields: ['name'],
		enableFallback: true,
	});

	const discountData = await handleFormatDiscount(discount, acceptLanguage);

	return {
		...translationData,
		...discountData,
	};
}

/** * Format discount specifically for edit forms
 */
export async function formatDiscountForEdit(
	discount: DiscountWithRelations,
	acceptLanguage?: string,
): Promise<TDiscountFormValues> {
	const translationData = await mapTranslations(discount?.translations, {
		accept_language: '*',
		fields: ['name'],
		enableFallback: true,
	});

	const discountData: FormattedDiscount = await handleFormatDiscount(discount, acceptLanguage);

	return {
		name_ar: translationData.name_ar || '',
		name_en: translationData.name_en || '',
		...discountData,
	} as TDiscountFormValues;
}

/** * Check for overlapping active discounts
 */
export async function checkOverlappingDiscounts(
	productIds: string[],
	startDate: Date,
	endDate: Date | null,
	priority: number,
	excludeDiscountId?: string,
): Promise<{ hasOverlap: boolean; overlappingProducts: string[] }> {
	const whereCondition: Prisma.ProductDiscountWhereInput = {
		...(excludeDiscountId && { id: { not: excludeDiscountId } }),
		products: { some: { productId: { in: productIds } } },
		isActive: true,
		priority: { gte: priority },
		OR: [
			{
				AND: [{ startDate: { lte: startDate } }, { OR: [{ endDate: null }, { endDate: { gte: startDate } }] }],
			},
			...(endDate
				? [
						{
							AND: [{ startDate: { lte: endDate } }, { OR: [{ endDate: null }, { endDate: { gte: endDate } }] }],
						},
					]
				: []),
		],
	};

	const overlappingDiscounts = await prisma_DB.productDiscount.findMany({
		where: whereCondition,
		include: { products: { where: { productId: { in: productIds } }, select: { productId: true } } },
	});

	const overlappingProductIds = [...new Set(overlappingDiscounts.flatMap((d) => d.products.map((p) => p.productId)))];

	return {
		hasOverlap: overlappingProductIds.length > 0,
		overlappingProducts: overlappingProductIds,
	};
}

/** * Validate all product IDs exist in database
 */
export async function validateProducts(productIds: string[]): Promise<{ success: boolean; error?: string }> {
	if (!productIds || productIds.length === 0) {
		return { success: false, error: 'api.errors.no_products_selected' };
	}

	const products = await prisma_DB.product.findMany({
		where: { id: { in: productIds } },
		select: { id: true },
	});

	if (products.length !== productIds.length) {
		return { success: false, error: 'api.errors.some_products_not_found' };
	}

	return { success: true };
}

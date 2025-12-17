'use server';
import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchemaDiscount, TDiscountFormValues } from '@/validation/discount-validation';
import { DiscountType, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { cookies } from 'next/headers';

let user: { id: string; name: string } | null = null;

// type DiscountWithRelations = Prisma.ProductDiscountGetPayload<{
// 	// include: { product: { include: { translations: true } } };
// 	include: { products: { product: select: { id: true; { include: { translations: { select: { name: true } } images: { include: { image: true } } } } } } };
// }>;

// discount.types.ts

import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { TImage } from '@/types/api';

// ✅ Type للخصم مع العلاقات (many-to-many)
type DiscountWithRelations = Prisma.ProductDiscountGetPayload<{
	include: {
		products: {
			include: {
				product: {
					select: { id: true; basePrice: true };
					include: { translations: { select: { lang: true; name: true } }; images: { include: { image: true } } };
				};
			};
		};
	};
}>;

// ✅ Type للمنتج المرتبط بالخصم
export interface DiscountProduct {
	id: string;
	name: string;
	basePrice: number;
	finalPrice: number;
	discountAmount: number;
	discountPercentage: number;
	images?: TImage[];
}

// ✅ Type للخصم المنسق (بعد formatDiscount)
export interface FormattedDiscount {
	id: string;
	name?: string;
	name_ar: string;
	name_en: string;
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
	products: DiscountProduct[];
	totalProducts: number;
}

// ✅ Type للمنتج مع معلومات الخصم (للعرض في Frontend)
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

// ✅ Type لمعلومات الخصم النشط
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

// ✅ Type لـ Discount Calculation
export interface DiscountCalculation {
	basePrice: number;
	finalPrice: number;
	discountAmount: number;
	discountPercentage: number;
	appliedDiscount: {
		type: DiscountType;
		value: number;
		minDiscountValue: number | null;
		maxDiscountValue: number | null;
	} | null;
}

// ✅ Type لـ Overlapping Discount Check
export interface OverlapCheckResult {
	hasOverlap: boolean;
	overlappingProducts: string[];
	overlappingDiscounts?: {
		id: string;
		productId: string;
		startDate: string;
		endDate: string | null;
		priority: number;
	}[];
}

// ✅ Helper type guards
export async function isPercentageDiscount(type: DiscountType): Promise<boolean> {
	return type === DiscountType.PERCENTAGE;
}

export async function isFixedDiscount(type: DiscountType): Promise<boolean> {
	return type === DiscountType.FIXED;
}

// ✅ Constants
const DISCOUNT_CONSTANTS = {
	MAX_PERCENTAGE: 100,
	MIN_PERCENTAGE: 0,
	MIN_FIXED_VALUE: 0,
	MAX_PRIORITY: 100,
	MIN_PRIORITY: 0,
	DEFAULT_PRIORITY: 0,
} as const;

export type Discount = {
	id: string;
	name_ar: string;
	name_en: string;
	// productId: string;
	// productName?: string;
	products: {
		id: string;
		name?: string;
		basePrice?: number;
		images?: { url: string; fileId: string }[];
	}[];
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
};

export type DiscountFormData = TDiscountFormValues & {
	products: string[];
};

/** 🔹 Format Single Product for Discount */
async function formatDiscountProduct(
	productRelation: DiscountWithRelations['products'][0],
	discountType: DiscountType,
	discountValue: number,
	minDiscountValue: number | null,
	maxDiscountValue: number | null,
	acceptLanguage?: string
): Promise<DiscountProduct> {
	const { product } = productRelation;
	const locale = await getCurrentLocale();
	// Get product name from translations
	console.log('acceptLanguage--', acceptLanguage);
	let productName = '';
	if (product.translations && product.translations.length > 0) {
		const productTranslation = await mapTranslations(product.translations, {
			accept_language: acceptLanguage && acceptLanguage !== '*' ? acceptLanguage : locale || locale,
			fields: ['name'],
			enableFallback: true, // false,
		});
		productName = (productTranslation as { name?: string }).name || '';
		console.log('productTranslation---', productTranslation);
	}

	console.log('product.translations', product.translations);

	// Calculate final price
	const finalPrice = await calculateDiscountedPrice(product.basePrice, {
		type: discountType,
		value: discountValue,
		minDiscountValue,
		maxDiscountValue,
	});

	const discountAmount = product.basePrice - (await finalPrice);
	const discountPercentage = Math.round((discountAmount / product.basePrice) * 100);

	// Get first image
	const firstImage =
		product.images && product.images.length > 0
			? {
					url: product.images[0].image?.url || '',
					fileId: product.images[0].image?.fileId || '',
			  }
			: undefined;

	return {
		id: product.id,
		name: productName,
		basePrice: product.basePrice,
		finalPrice,
		discountAmount,
		discountPercentage,
		images: firstImage ? [firstImage] : [],
	};
}

/** 🔹 Format Discount */
async function formatDiscount(discount: DiscountWithRelations, acceptLanguage?: string): Promise<FormattedDiscount> {
	const { name_ar, name_en, products, startDate, endDate, createdAt, updatedAt, ...rest } = discount;

	// Format all products
	const formattedProducts = await Promise.all(
		products.map((productRelation) =>
			formatDiscountProduct(
				productRelation,
				discount.type,
				discount.value,
				discount.minDiscountValue,
				discount.maxDiscountValue,
				acceptLanguage
			)
		)
	);

	return {
		...rest,
		name_ar,
		name_en,
		...(acceptLanguage !== '*' && {
			name: acceptLanguage?.startsWith('ar') ? name_ar || name_en : name_en || name_ar,
		}),
		startDate: startDate.toISOString(),
		endDate: endDate ? endDate.toISOString() : null,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
		products: formattedProducts,
		totalProducts: formattedProducts.length,
	};
}

/** 🔹 Get All Discounts */
export async function getAllDiscounts(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		productId?: string;
		isActive?: boolean;
		type?: DiscountType;
	},
	locale?: TLocalesData
): Promise<ActionResult<FormattedDiscount>> {
	// try {
	const cookiesStore = await cookies();
	const userCookie = cookiesStore.get('user')?.value;
	if (userCookie) {
		try {
			user = JSON.parse(userCookie);
		} catch {
			user = null;
		}
	}

	const page = Math.max(1, Number(params?.page) || 1);
	const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10));
	const search = params?.search?.trim() || '';
	const skip = (page - 1) * limit;

	const sortableFields = ['name_ar', 'name_en', 'startDate', 'endDate', 'priority', 'isActive', 'createdAt'];
	const sortBy = sortableFields.includes(params?.sortBy || '') ? (params?.sortBy as string) : 'createdAt';
	const sortOrder = params?.sortOrder === 'asc' ? 'asc' : 'desc';

	const where: Prisma.ProductDiscountWhereInput = {
		...(search && {
			OR: [
				{ name_ar: { contains: search, mode: 'insensitive' } },
				{ name_en: { contains: search, mode: 'insensitive' } },
				{
					products: {
						some: {
							product: {
								translations: {
									some: {
										OR: [
											{ name: { contains: search, mode: 'insensitive' } },
											{ slug: { contains: search, mode: 'insensitive' } },
										],
									},
								},
							},
						},
					},
				},
			],
		}),
		...(params?.productId && {
			products: {
				some: {
					productId: params.productId,
				},
			},
		}),
		...(params?.isActive !== undefined && { isActive: params.isActive }),
		...(params?.type && { type: params.type }),
	};

	const [discounts, total] = await Promise.all([
		prisma_DB.productDiscount.findMany({
			where,
			skip,
			take: limit,
			include: {
				products: {
					include: {
						product: {
							// select: { id: true, basePrice: true },
							include: {
								translations: { select: { lang: true, name: true } },
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
			},
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma_DB.productDiscount.count({ where }),
	]);

	const data = await Promise.all(discounts.map((d) => formatDiscount(d, locale)));

	return {
		success: true,
		status: 200,
		data,
		meta: {
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
			sort: { by: sortBy, order: sortOrder },
		},
	};
	// } catch (error) {
	// 	logger.error('Error fetching discounts', { error, context: 'DiscountService' });
	// 	throw new AppError('api.discounts.errors.fetch_failed', 500);
	// }
}

/** 🔹 Get Discount By ID */
export async function getDiscount(id: string, locale?: string): Promise<ActionResult<FormattedDiscount>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	const discount = await prisma_DB.productDiscount.findUnique({
		where: { id },
		include: {
			products: {
				include: {
					product: {
						// select: { id: true, basePrice: true },
						include: {
							translations: { select: { lang: true, name: true } },
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
		},
	});

	if (!discount) throw new AppError('api.discounts.errors.not_found', 404);
	console.log('locale--', locale);
	const data = await formatDiscount(discount, locale);
	return { success: true, status: 200, data };
}

/** 🔹 Get Active Discount for Product */
export async function getActiveDiscountForProduct(productId: string, locale?: string): Promise<FormattedDiscount | null> {
	if (!productId) return null;

	const now = new Date();

	const discount = await prisma_DB.productDiscount.findFirst({
		where: {
			products: { some: { productId } },
			isActive: true,
			startDate: { lte: now },
			OR: [{ endDate: null }, { endDate: { gte: now } }],
		},
		orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
		include: {
			products: {
				include: {
					product: {
						select: { id: true, basePrice: true },
						include: {
							translations: { select: { lang: true, name: true } },
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
		},
	});

	if (!discount) return null;

	return formatDiscount(discount, locale);
}

/** 🔹 Calculate Discounted Price */
export async function calculateDiscountedPrice(
	basePrice: number,
	discount: {
		type: DiscountType;
		value: number;
		minDiscountValue?: number | null;
		maxDiscountValue?: number | null;
	}
): Promise<number> {
	if (basePrice <= 0 || discount.value <= 0) return basePrice;

	let discountAmount = 0;

	// Calculate discount amount
	if (discount.type === DiscountType.FIXED) {
		discountAmount = discount.value;
	} else if (discount.type === DiscountType.PERCENTAGE) {
		discountAmount = (basePrice * discount.value) / 100;
	}

	// Apply min constraint (only if > 0)
	if (discount.minDiscountValue && discount.minDiscountValue > 0 && discountAmount < discount.minDiscountValue) {
		discountAmount = discount.minDiscountValue;
	}

	// Apply max constraint (only if > 0)
	if (discount.maxDiscountValue && discount.maxDiscountValue > 0 && discountAmount > discount.maxDiscountValue) {
		discountAmount = discount.maxDiscountValue;
	}

	// Ensure discount doesn't exceed base price
	discountAmount = Math.min(discountAmount, basePrice);

	const finalPrice = Math.max(0, basePrice - discountAmount);
	return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
}

/** 🔹 Validate Products Exist */
async function validateProducts(productIds: string[]): Promise<{ success: boolean; error?: string }> {
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

/** 🔹 Check Overlapping Discounts */
async function checkOverlappingDiscounts(
	productIds: string[],
	startDate: Date,
	endDate: Date | null,
	priority: number,
	excludeDiscountId?: string
): Promise<{ hasOverlap: boolean; overlappingProducts: string[] }> {
	const whereCondition: Prisma.ProductDiscountWhereInput = {
		...(excludeDiscountId && { id: { not: excludeDiscountId } }),
		products: {
			some: {
				productId: { in: productIds },
			},
		},
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
		include: {
			products: {
				where: {
					productId: { in: productIds },
				},
				select: {
					productId: true,
				},
			},
		},
	});

	const overlappingProductIds = [...new Set(overlappingDiscounts.flatMap((d) => d.products.map((p) => p.productId)))];

	return {
		hasOverlap: overlappingProductIds.length > 0,
		overlappingProducts: overlappingProductIds,
	};
}

/** 🟢 Create Discount (Multiple Products) */
export async function createDiscount(data: DiscountFormData): Promise<ActionResult<FormattedDiscount>> {
	// try {
	const validation = await ValidateFormAction(formSchemaDiscount, data);
	if (!validation.success) {
		return {
			success: false,
			status: 400,
			data: {} as FormattedDiscount,
			form_errors: JSON.stringify(validation.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	// Validate products exist
	const productsValidation = await validateProducts(data.products);
	if (!productsValidation.success) {
		return {
			success: false,
			status: 400,
			data: {} as FormattedDiscount,
			form_errors: JSON.stringify({ products: [productsValidation.error] }),
			error: 'api.errors.inputs_validation',
		};
	}

	const startDate = new Date(data.startDate);
	const endDate = data.endDate ? new Date(data.endDate) : null;
	const priority = data.priority ?? 0;

	// Check for overlapping discounts
	const overlapCheck = await checkOverlappingDiscounts(data.products, startDate, endDate, priority);

	if (overlapCheck.hasOverlap) {
		return {
			success: false,
			status: 400,
			data: {} as FormattedDiscount,
			form_errors: JSON.stringify({
				products: ['api.discounts.errors.overlapping_discount_for_products'],
				overlappingProducts: overlapCheck.overlappingProducts,
			}),
			error: 'api.errors.inputs_validation',
		};
	}

	// Normalize min/max values (set to null if 0 or undefined)
	const minDiscountValue = data.minDiscountValue && data.minDiscountValue > 0 ? data.minDiscountValue : null;
	const maxDiscountValue = data.maxDiscountValue && data.maxDiscountValue > 0 ? data.maxDiscountValue : null;

	// Create discount with products relation in a transaction
	const discount = await prisma_DB.productDiscount.create({
		data: {
			name_ar: data.name_ar,
			name_en: data.name_en,
			type: data.type,
			value: data.value,
			startDate,
			endDate,
			isActive: data.isActive ?? true,
			priority,
			minDiscountValue,
			maxDiscountValue,
			products: {
				create: data.products.map((productId) => ({
					productId,
				})),
			},
		},
		include: {
			products: {
				include: {
					product: {
						select: { id: true, basePrice: true },
						include: {
							translations: { select: { lang: true, name: true } },
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
		},
	});

	revalidatePath('/dashboard/discounts');
	revalidateTag('products', 'max');
	revalidateTag('discounts', 'max');

	logger.info(`✅ Discount created: ${discount.id} for ${data.products.length} products`, {
		context: 'DiscountService',
	});

	const formattedData = await formatDiscount(discount);

	return {
		success: true,
		status: 201,
		data: formattedData,
		message: 'api.discounts.success.create',
	};
	// 	} catch (error) {
	// 		logger.error('Error creating discount', { error, context: 'DiscountService' });
	// 		throw new AppError('api.discounts.errors.create_failed', 500);
	// 	}
}

/** 🟡 Update Discount */
export async function updateDiscount(id: string, data: Partial<DiscountFormData>): Promise<ActionResult<FormattedDiscount>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	try {
		const validation = await ValidateFormAction(formSchemaDiscount, data);
		if (!validation.success) {
			return {
				success: false,
				status: 400,
				data: {} as FormattedDiscount,
				form_errors: JSON.stringify(validation.form_errors),
				error: 'api.errors.inputs_validation',
			};
		}

		// Check if discount exists
		const existingDiscount = await prisma_DB.productDiscount.findUnique({
			where: { id },
			include: {
				products: {
					select: {
						productId: true,
					},
				},
			},
		});

		if (!existingDiscount) {
			throw new AppError('api.discounts.errors.not_found', 404);
		}

		// Use existing products if not provided
		const productIds = data.products || existingDiscount.products.map((p) => p.productId);

		// Validate products exist
		const productsValidation = await validateProducts(productIds);
		if (!productsValidation.success) {
			return {
				success: false,
				status: 400,
				data: {} as FormattedDiscount,
				form_errors: JSON.stringify({ products: [productsValidation.error] }),
				error: 'api.errors.inputs_validation',
			};
		}

		const startDate = new Date(data.startDate!);
		const endDate = data.endDate ? new Date(data.endDate) : null;
		const priority = data.priority ?? 0;

		// Check for overlapping discounts (excluding current discount)
		const overlapCheck = await checkOverlappingDiscounts(productIds, startDate, endDate, priority, id);

		if (overlapCheck.hasOverlap) {
			return {
				success: false,
				status: 400,
				data: {} as FormattedDiscount,
				form_errors: JSON.stringify({ startDate: ['api.discounts.errors.overlapping_discount'] }),
				error: 'api.errors.inputs_validation',
			};
		}

		// Normalize min/max values
		const minDiscountValue = data.minDiscountValue && data.minDiscountValue > 0 ? data.minDiscountValue : null;
		const maxDiscountValue = data.maxDiscountValue && data.maxDiscountValue > 0 ? data.maxDiscountValue : null;

		// Update discount with products
		const discount = await prisma_DB.productDiscount.update({
			where: { id },
			data: {
				name_ar: data.name_ar!,
				name_en: data.name_en!,
				type: data.type!,
				value: data.value!,
				startDate,
				endDate,
				isActive: data.isActive ?? true,
				priority,
				minDiscountValue,
				maxDiscountValue,
				// Update products relation
				products: {
					deleteMany: {},
					create: productIds.map((productId) => ({
						productId,
					})),
				},
			},
			include: {
				products: {
					include: {
						product: {
							select: { id: true, basePrice: true },
							include: {
								translations: { select: { lang: true, name: true } },
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
			},
		});

		revalidateTag('discounts', 'max');
		revalidateTag('products', 'max');

		const formattedData = await formatDiscount(discount);
		logger.info(`✅ Discount updated: ${discount.id}`, { context: 'DiscountService' });

		return {
			success: true,
			status: 200,
			data: formattedData,
			message: 'api.discounts.success.update',
		};
	} catch (error) {
		logger.error('Error updating discount', { error, context: 'DiscountService' });
		if (error instanceof AppError) throw error;
		throw new AppError('api.discounts.errors.update_failed', 500);
	}
}

/** 🟢 Toggle Active */
export async function toggleStateDiscount(
	id: string,
	isActive: boolean
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	try {
		const updated = await prisma_DB.productDiscount.update({
			where: { id },
			data: { isActive },
			select: { id: true, isActive: true },
		});

		revalidateTag('discounts', 'max');
		revalidateTag('products', 'max');

		return {
			success: true,
			status: 200,
			data: updated,
			message: 'api.success.update_status',
		};
	} catch (error) {
		logger.error('Error toggling discount state', { error, context: 'DiscountService' });
		throw new AppError('api.discounts.errors.toggle_failed', 500);
	}
}

/** 🔴 Delete */
export async function deleteDiscount(id: string): Promise<ActionResult<null>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	try {
		// Delete discount (cascade will delete relations)
		await prisma_DB.productDiscount.delete({ where: { id } });

		// revalidateTag('discounts', 'max');
		// revalidateTag('products', 'max');

		updateTag('discounts');
		updateTag('products');

		logger.info(`✅ Discount deleted: ${id}`, { context: 'DiscountService' });

		return {
			success: true,
			status: 200,
			data: null,
			message: 'api.discounts.success.delete',
		};
	} catch (error) {
		logger.error('Error deleting discount', { error, context: 'DiscountService' });
		throw new AppError('api.discounts.errors.delete_failed', 500);
	}
}

/** 🔴 Delete Many */
export async function deleteManyDiscounts(ids: string[]): Promise<ActionResult<null>> {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	try {
		const deleted = await prisma_DB.productDiscount.deleteMany({
			where: { id: { in: ids } },
		});

		if (!deleted.count) throw new AppError('api.discounts.errors.no_records_deleted', 404);

		revalidateTag('discounts', 'max');
		revalidateTag('products', 'max');

		logger.info(`✅ ${deleted.count} discounts deleted`, { context: 'DiscountService' });

		return {
			success: true,
			status: 200,
			data: null,
			message: 'api.discounts.success.delete_many',
		};
	} catch (error) {
		logger.error('Error deleting multiple discounts', { error, context: 'DiscountService' });
		if (error instanceof AppError) throw error;
		throw new AppError('api.discounts.errors.delete_many_failed', 500);
	}
}

/** 🔹 Get Products with Calculated Prices */
export async function getProductsWithDiscounts(productIds?: string[], locale?: string) {
	try {
		const where: Prisma.ProductWhereInput = productIds?.length ? { id: { in: productIds } } : {};
		const now = new Date();

		const products = await prisma_DB.product.findMany({
			where,
			include: {
				discounts: {
					where: {
						discount: {
							isActive: true,
							startDate: { lte: now },
							OR: [{ endDate: null }, { endDate: { gte: now } }],
						},
					},
					include: {
						discount: true,
					},
					orderBy: {
						discount: {
							priority: 'desc',
						},
					},
					take: 1,
				},
			},
		});

		return products.map(async (product) => {
			const activeDiscountRelation = product.discounts[0];
			const activeDiscount = activeDiscountRelation?.discount;
			const finalPrice = activeDiscount ? calculateDiscountedPrice(product.basePrice, activeDiscount) : product.basePrice;
			const discountAmount = activeDiscount ? product.basePrice - (await finalPrice) : 0;
			const discountPercentage = activeDiscount ? Math.round((discountAmount / product.basePrice) * 100) : 0;

			return {
				...product,
				finalPrice,
				discountAmount,
				discountPercentage,
				activeDiscount: activeDiscount || null,
				hasDiscount: !!activeDiscount,
			};
		});
	} catch (error) {
		logger.error('Error fetching products with discounts', { error, context: 'DiscountService' });
		throw new AppError('api.products.errors.fetch_failed', 500);
	}
}

/** 🔹 Get Discounts By Product IDs */
export async function getDiscountsByProducts(
	productIds: string[],
	locale?: string
): Promise<ActionResult<Record<string, FormattedDiscount>>> {
	if (!productIds?.length) {
		return { success: true, status: 200, data: {} };
	}

	try {
		const now = new Date();

		const discounts = await prisma_DB.productDiscount.findMany({
			where: {
				products: { some: { productId: { in: productIds } } },
				isActive: true,
				startDate: { lte: now },
				OR: [{ endDate: null }, { endDate: { gte: now } }],
			},
			include: {
				products: {
					include: {
						product: {
							select: { id: true, basePrice: true },
							include: {
								translations: { select: { lang: true, name: true } },
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
			},
			orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
		});

		// Group by productId and take highest priority
		const discountMap: Record<string, FormattedDiscount> = {};
		for (const discount of discounts) {
			for (const productRelation of discount.products) {
				if (!discountMap[productRelation.productId]) {
					discountMap[productRelation.productId] = await formatDiscount(discount, locale);
				}
			}
		}

		return { success: true, status: 200, data: discountMap };
	} catch (error) {
		logger.error('Error fetching discounts by products', { error, context: 'DiscountService' });
		throw new AppError('api.discounts.errors.fetch_failed', 500);
	}
}

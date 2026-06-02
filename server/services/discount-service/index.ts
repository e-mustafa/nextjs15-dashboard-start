'use server';
import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { parseListParams } from '@/lib/utils.server/query';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchemaDiscount, TDiscountFormValues } from '@/validation/discount-validation';
import { DiscountType, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { calculateDiscountedPrice } from '../utils';
import { discountWithRelationsInclude } from './prisma-includes';
import { FormattedDiscount } from './types';
import { checkOverlappingDiscounts, formatDiscount, formatDiscountForEdit, validateProducts } from './utils';

/** 🔹 Get All Discounts with pagination and search filters */
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
	locale?: TLocalesData,
): Promise<ActionResult<FormattedDiscount>> {
	// ✅ FIX: Localized user context to prevent server-side session leaking
	// const cookiesStore = await cookies();
	// const userCookie = cookiesStore.get('user')?.value;
	// const user = userCookie ? JSON.parse(userCookie) : null;

	const { page, limit, skip, search, sortBy, sortOrder } = parseListParams(params, {
		sortableFields: ['name_ar', 'name_en', 'startDate', 'endDate', 'priority', 'isActive', 'createdAt'],
		defaultSortOrder: 'asc',
	});

	const where: Prisma.ProductDiscountWhereInput = {
		...(search && {
			OR: [
				{
					translations: {
						some: {
							OR: [
								{ name: { contains: search, mode: 'insensitive' } },
								{ description: { contains: search, mode: 'insensitive' } },
							],
						},
					},
				},
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
		...(params?.productId && { products: { some: { productId: params.productId } } }),
		...(params?.isActive !== undefined && { isActive: params.isActive }),
		...(params?.type && { type: params.type }),
	};

	const [discounts, total] = await Promise.all([
		prisma_DB.productDiscount.findMany({
			where,
			skip,
			take: limit,
			include: discountWithRelationsInclude, // ✅ Clean and Reusable include
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
}

/** 🔹 Get Discount By ID */
export async function getDiscount(id: string, locale?: string): Promise<ActionResult<TDiscountFormValues>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	const discount = await prisma_DB.productDiscount.findUnique({
		where: { id },
		include: discountWithRelationsInclude,
	});

	if (!discount) throw new AppError('api.discounts.errors.not_found', 404);

	const data = await formatDiscountForEdit(discount, locale);
	return { success: true, status: 200, data };
}

/** 🔹 Get Discounts By Product IDs */
export async function getDiscountsByProducts(
	productIds: string[],
	locale?: string,
): Promise<ActionResult<Record<string, FormattedDiscount>>> {
	if (!productIds?.length) {
		// return { success: true, status: 200, data: {} };
		throw new AppError('api.errors.empty_ids', 400);
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
			include: discountWithRelationsInclude,
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

/** 🔹 Get Products with calculated active discount prices */
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
					include: { discount: true },
					orderBy: { discount: { priority: 'desc' } },
					take: 1,
				},
			},
		});

		// ✅ FIX: Wrapped in Promise.all to handle async maps correctly
		return Promise.all(
			products.map(async (product) => {
				const activeDiscountRelation = product.discounts[0];
				const activeDiscount = activeDiscountRelation?.discount;
				const finalPrice = activeDiscount
					? calculateDiscountedPrice(product.basePrice, activeDiscount)
					: product.basePrice;
				const discountAmount = activeDiscount ? product.basePrice - (await finalPrice) : 0;
				const discountPercentage = activeDiscount ? Math.round((discountAmount / product.basePrice) * 100) : 0;

				return {
					...product,
					finalPrice: await finalPrice,
					discountAmount,
					discountPercentage,
					activeDiscount: activeDiscount || null,
					hasDiscount: !!activeDiscount,
				};
			}),
		);
	} catch (error) {
		logger.error('Error fetching products with discounts', { error, context: 'DiscountService' });
		throw new AppError('api.products.errors.fetch_failed', 500);
	}
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
		include: discountWithRelationsInclude,
	});

	if (!discount) return null;

	return formatDiscount(discount, locale);
}

/** 🟢 Create Discount (Multiple Products) */
export async function createDiscount(data: TDiscountFormValues): Promise<ActionResult<TDiscountFormValues>> {
	const validation = await ValidateFormAction(formSchemaDiscount, data);
	if (!validation.success) {
		return {
			success: false,
			status: 400,
			data: {} as TDiscountFormValues,
			form_errors: JSON.stringify(validation.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	const productsValidation = await validateProducts(data.products);
	if (!productsValidation.success) {
		return {
			success: false,
			status: 400,
			data: {} as TDiscountFormValues,
			form_errors: JSON.stringify({ products: [productsValidation.error] }),
			error: 'api.errors.inputs_validation',
		};
	}

	const startDate = new Date(data.startDate);
	const endDate = data.endDate ? new Date(data.endDate) : null;
	const priority = data.priority ?? 0;

	const overlapCheck = await checkOverlappingDiscounts(data.products, startDate, endDate, priority);
	if (overlapCheck.hasOverlap) {
		return {
			success: false,
			status: 400,
			data: {} as TDiscountFormValues,
			form_errors: JSON.stringify({
				products: ['api.discounts.errors.overlapping_discount_for_products'],
				overlappingProducts: overlapCheck.overlappingProducts,
			}),
			error: 'api.errors.inputs_validation',
		};
	}

	const minDiscountValue = data.minDiscountValue && data.minDiscountValue > 0 ? data.minDiscountValue : null;
	const maxDiscountValue = data.maxDiscountValue && data.maxDiscountValue > 0 ? data.maxDiscountValue : null;

	const discount = await prisma_DB.productDiscount.create({
		data: {
			type: data.type,
			value: data.value,
			startDate,
			endDate,
			isActive: data.isActive ?? true,
			priority,
			minDiscountValue,
			maxDiscountValue,
			translations: {
				create: [
					{ lang: 'ar', name: data.name_ar },
					{ lang: 'en', name: data.name_en },
				],
			},
			products: { create: data.products.map((productId) => ({ productId })) },
		},
		include: discountWithRelationsInclude,
	});

	revalidatePath('/dashboard/discounts');
	revalidateTag('products', 'max');
	revalidateTag('discounts', 'max');

	const formattedData = await formatDiscountForEdit(discount);
	return {
		success: true,
		status: 201,
		data: formattedData,
		message: 'api.discounts.success.create',
	};
}

/** 🟡 Update Discount */
export async function updateDiscount(
	id: string,
	data: Partial<TDiscountFormValues>,
): Promise<ActionResult<TDiscountFormValues>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	try {
		const validation = await ValidateFormAction(formSchemaDiscount, data);
		if (!validation.success) {
			return {
				success: false,
				status: 400,
				data: {} as TDiscountFormValues,
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
				data: {} as TDiscountFormValues,
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
				data: {} as TDiscountFormValues,
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
				type: data.type!,
				value: data.value!,
				startDate,
				endDate,
				isActive: data.isActive ?? true,
				priority,
				minDiscountValue,
				maxDiscountValue,
				// ✅ Update translations
				translations: {
					deleteMany: {},
					create: [
						{ lang: 'ar', name: data.name_ar || '' },
						{ lang: 'en', name: data.name_en || '' },
					],
				},
				// Update products relation
				products: {
					deleteMany: {},
					create: productIds.map((productId) => ({
						productId,
					})),
				},
			},
			include: discountWithRelationsInclude,
		});

		revalidateTag('discounts', 'max');
		revalidateTag('products', 'max');

		const formattedData = await formatDiscountForEdit(discount);
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
	isActive: boolean,
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

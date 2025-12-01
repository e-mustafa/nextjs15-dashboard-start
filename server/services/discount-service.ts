'use server';
import { TLocalesData } from '@/configs/general';
// import { DiscountType } from '@/constant/enums';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchemaDiscount, TDiscountFormValues } from '@/validation/discount-validation';
import { DiscountType, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

let user: { id: string; name: string } | null = null;

type DiscountWithRelations = Prisma.ProductDiscountGetPayload<{
	include: { product: true };
}>;

export type Discount = {
	id: string;
	name: string;
	// name_ar: string;
	// name_en: string;
	productId: string;
	productName?: string;
	type: DiscountType;
	value: number;
	startDate: string;
	endDate?: string | null;
	isActive: boolean;
	priority: number;
	minDiscountValue?: number | null;
	maxDiscountValue?: number | null;
	createdAt?: string;
	updatedAt?: string;
};

async function formatDiscount(discount: DiscountWithRelations, locale?: string): Promise<Discount> {
	const { name_ar, name_en, product, startDate, endDate, createdAt, updatedAt, ...rest } = discount;

	return {
		...rest,
		name: locale === 'ar' ? name_ar || name_en : name_en || name_ar,
		// productName: locale === 'ar' ? product?.name_ar : product?.name_en,
		startDate: startDate.toISOString(),
		endDate: endDate?.toISOString() || null,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
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
): Promise<ActionResult<Discount>> {
	const cookiesStore = await cookies();
	const userCookie = cookiesStore.get('user')?.value;
	if (userCookie) {
		try {
			user = JSON.parse(userCookie);
		} catch {
			user = null;
		}
	}

	const page = Number(params?.page) || 1;
	const limit = Number(params?.limit) || 10;
	const search = params?.search?.trim() || '';
	const skip = (page - 1) * limit;

	const sortableFields = ['name_ar', 'name_en', 'startDate', 'endDate', 'priority', 'isActive', 'createdAt'];
	const sortBy = sortableFields.includes(params?.sortBy || '') ? params?.sortBy : 'createdAt';
	const sortOrder = params?.sortOrder === 'desc' ? 'desc' : 'asc';

	const where: Prisma.ProductDiscountWhereInput = {
		...(search && {
			OR: [
				{ name_ar: { contains: search, mode: 'insensitive' } },
				{ name_en: { contains: search, mode: 'insensitive' } },
				{
					product: {
						OR: [
							{ name_ar: { contains: search, mode: 'insensitive' } },
							{ name_en: { contains: search, mode: 'insensitive' } },
						],
					},
				},
			],
		}),
		...(params?.productId && { productId: params.productId }),
		...(params?.isActive !== undefined && { isActive: params.isActive }),
		...(params?.type && { type: params.type }),
	};

	const [discounts, total] = await Promise.all([
		prisma_DB.productDiscount.findMany({
			where,
			skip,
			take: limit,
			include: { product: true },
			orderBy: { [sortBy as string]: sortOrder },
		}),
		prisma_DB.productDiscount.count({ where }),
	]);

	const data = await Promise.all(discounts.map((d) => formatDiscount(d, locale)));

	return {
		success: true,
		status: 200,
		data: data as Discount[],
		meta: {
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
			sort: { by: sortBy!, order: sortOrder },
		},
	};
}

/** 🔹 Get Discount By ID */
export async function getDiscount(id: string) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const discount = await prisma_DB.productDiscount.findUnique({
		where: { id },
		include: { product: true },
	});

	if (!discount) throw new AppError('api.discounts.errors.not_found', 404);

	const data = await formatDiscount(discount);
	return { success: true, status: 200, data };
}

/** 🔹 Get Active Discount for Product */
export async function getActiveDiscountForProduct(productId: string): Promise<Discount | null> {
	const now = new Date();

	const discount = await prisma_DB.productDiscount.findFirst({
		where: {
			productId,
			isActive: true,
			startDate: { lte: now },
			OR: [{ endDate: null }, { endDate: { gte: now } }],
		},
		orderBy: { priority: 'desc' },
		include: { product: true },
	});

	if (!discount) return null;

	return formatDiscount(discount) as Promise<Discount>;
}

/** 🔹 Calculate Discounted Price */
export async function calculateDiscountedPrice(
	basePrice: number,
	discount: { type: DiscountType; value: number; minDiscountValue?: number | null; maxDiscountValue?: number | null }
): Promise<number> {
	let discountAmount = 0;

	if (discount.type === DiscountType.FIXED) {
		discountAmount = discount.value;
	} else if (discount.type === DiscountType.PERCENTAGE) {
		discountAmount = (basePrice * discount.value) / 100;
	}

	// Apply min/max constraints
	if (discount.minDiscountValue && discountAmount < discount.minDiscountValue) {
		discountAmount = discount.minDiscountValue;
	}
	if (discount.maxDiscountValue && discountAmount > discount.maxDiscountValue) {
		discountAmount = discount.maxDiscountValue;
	}

	const finalPrice = Math.max(0, basePrice - discountAmount);
	return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
}

/** 🟢 Create Discount */
export async function createDiscount(data: TDiscountFormValues): Promise<ActionResult<Discount>> {
	const validation = await ValidateFormAction(formSchemaDiscount, data);
	if (!validation.success)
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };

	// Validate product exists
	const product = await prisma_DB.product.findUnique({
		where: { id: data.productId },
	});

	if (!product) {
		return {
			success: false,
			status: 404,
			form_errors: JSON.stringify({ productId: ['api.errors.product_not_found'] }),
			error: 'api.errors.inputs_validation',
		};
	}

	// Check for overlapping discounts with higher priority
	const startDate = new Date(data.startDate);
	const endDate = data.endDate ? new Date(data.endDate) : null;

	const overlappingDiscount = await prisma_DB.productDiscount.findFirst({
		where: {
			productId: data.productId,
			isActive: true,
			priority: { gte: data.priority ?? 0 },
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
		},
	});

	if (overlappingDiscount) {
		return {
			success: false,
			status: 400,
			form_errors: JSON.stringify({ startDate: ['api.discounts.errors.overlapping_discount'] }),
			error: 'api.errors.inputs_validation',
		};
	}

	const discount = await prisma_DB.productDiscount.create({
		data: {
			name_ar: data.name_ar,
			name_en: data.name_en,
			productId: data.productId as string,
			type: data.type,
			value: data.value,
			startDate,
			endDate,
			isActive: data.isActive ?? true,
			priority: data.priority ?? 0,
			minDiscountValue: data.minDiscountValue,
			maxDiscountValue: data.maxDiscountValue,
		},
		include: { product: true },
	});

	revalidatePath('/dashboard/discounts');
	revalidateTag('products', 'max');

	const formattedData = await formatDiscount(discount as DiscountWithRelations);
	logger.info(`✅ Discount created: ${discount.id}`, { context: 'DiscountService' });

	return {
		success: true,
		status: 201,
		data: formattedData as Discount,
		message: 'api.discounts.success.create',
	};
}

/** 🟡 Update Discount */
export async function updateDiscount(id: string, data: TDiscountFormValues): Promise<ActionResult<Discount>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const validation = await ValidateFormAction(formSchemaDiscount, data);
	if (!validation.success)
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };

	// Validate product exists
	const product = await prisma_DB.product.findUnique({
		where: { id: data.productId },
	});

	if (!product) {
		return {
			success: false,
			status: 404,
			form_errors: JSON.stringify({ productId: ['api.errors.product_not_found'] }),
			error: 'api.errors.inputs_validation',
		};
	}

	// Check for overlapping discounts (excluding current discount)
	const startDate = new Date(data.startDate);
	const endDate = data.endDate ? new Date(data.endDate) : null;

	const overlappingDiscount = await prisma_DB.productDiscount.findFirst({
		where: {
			id: { not: id },
			productId: data.productId,
			isActive: true,
			priority: { gte: data.priority ?? 0 },
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
		},
	});

	if (overlappingDiscount) {
		return {
			success: false,
			status: 400,
			form_errors: JSON.stringify({ startDate: ['api.discounts.errors.overlapping_discount'] }),
			error: 'api.errors.inputs_validation',
		};
	}

	const discount = await prisma_DB.productDiscount.update({
		where: { id },
		data: {
			name_ar: data.name_ar,
			name_en: data.name_en,
			productId: data.productId,
			type: data.type,
			value: data.value,
			startDate,
			endDate,
			isActive: data.isActive ?? true,
			priority: data.priority ?? 0,
			minDiscountValue: data.minDiscountValue,
			maxDiscountValue: data.maxDiscountValue,
		},
		include: { product: true },
	});

	revalidateTag('discounts', 'max');
	revalidateTag('products', 'max');

	const formattedData = await formatDiscount(discount);
	logger.info(`✅ Discount updated: ${discount.id}`, { context: 'DiscountService' });

	return {
		success: true,
		status: 200,
		data: formattedData as Discount,
		message: 'api.discounts.success.update',
	};
}

/** 🟢 Toggle Active */
export async function toggleStateDiscount(id: string, isActive: boolean) {
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
}

/** 🔴 Delete */
export async function deleteDiscount(id: string) {
	await prisma_DB.productDiscount.delete({ where: { id } });

	revalidateTag('discounts', 'max');
	revalidateTag('products', 'max');

	logger.info(`✅ Discount deleted: ${id}`, { context: 'DiscountService' });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.discounts.success.delete',
	};
}

/** 🔴 Delete Many */
export async function deleteManyDiscounts(ids: string[]) {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	const deleted = await prisma_DB.productDiscount.deleteMany({
		where: { id: { in: ids } },
	});

	if (!deleted.count) throw new AppError('api.discounts.errors.delete', 404);

	revalidateTag('discounts', 'max');
	revalidateTag('products', 'max');

	logger.info(`✅ ${deleted.count} discounts deleted`, { context: 'DiscountService' });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.discounts.success.delete_many',
	};
}

/** 🔹 Get Products with Calculated Prices */
export async function getProductsWithDiscounts(productIds?: string[]) {
	const where: Prisma.ProductWhereInput = productIds ? { id: { in: productIds } } : {};

	const products = await prisma_DB.product.findMany({
		where,
		include: {
			discounts: {
				where: {
					isActive: true,
					startDate: { lte: new Date() },
					OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
				},
				orderBy: { priority: 'desc' },
				take: 1,
			},
		},
	});

	return products.map((product) => {
		const activeDiscount = product.discounts[0];
		const finalPrice = activeDiscount ? calculateDiscountedPrice(product.basePrice, activeDiscount) : product.basePrice;

		return {
			...product,
			finalPrice,
			activeDiscount,
			hasDiscount: !!activeDiscount,
		};
	});
}

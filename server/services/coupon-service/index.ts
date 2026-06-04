'use server';
import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { parseListParams } from '@/lib/utils.server/query';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchemaCoupon, TCouponFormValues as ICouponForm } from '@/validation/coupon-validation';
import { CouponApplicableOn, CouponType, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { calculateCouponDiscount } from '../utils';
import { couponWithRelationsInclude } from './prisma-includes';
import { ApplyCouponRequest, CouponStatistics, CouponValidation, FormattedCoupon } from './types';
import { checkCouponApplicability, formatCoupon, formatCouponForEdit } from './utils';

/** 🔹 Get All Coupons */
export async function getAllCoupons(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		type?: CouponType;
		applicableOn?: CouponApplicableOn;
		isActive?: boolean;
		isPublic?: boolean;
		isExpired?: boolean;
	},
	locale?: TLocalesData,
): Promise<ActionResult<FormattedCoupon>> {
	try {
		const { page, limit, skip, search, sortBy, sortOrder } = parseListParams(params, {
			sortableFields: ['code', 'name', 'startDate', 'endDate', 'usedCount', 'createdAt'],
			// defaultSortOrder: 'asc',
			// defaultSortBy: 'createdAt',
		});
		const localeKey = (locale?.split('-')[0] as 'ar' | 'en') || 'en';
		const localizedFields = ['name'];
		const finalSortKey = localizedFields.includes(sortBy) ? `${sortBy}_${localeKey}` : sortBy;

		const orderBy = { [finalSortKey]: sortOrder };

		const now = new Date();

		const where: Prisma.CouponWhereInput = {
			...(search && {
				OR: [
					{ code: { contains: search, mode: 'insensitive' } },
					{ translations: { some: { name: { contains: search, mode: 'insensitive' } } } },
				],
			}),
			...(params?.type && { type: params.type }),
			...(params?.applicableOn && { applicableOn: params.applicableOn }),
			...(params?.isActive !== undefined && { isActive: params.isActive }),
			...(params?.isPublic !== undefined && { isPublic: params.isPublic }),
			...(params?.isExpired === true && { endDate: { lt: now } }),
			...(params?.isExpired === false && { OR: [{ endDate: null }, { endDate: { gte: now } }] }),
		};

		const [coupons, total] = await Promise.all([
			prisma_DB.coupon.findMany({
				where,
				skip,
				take: limit,
				include: couponWithRelationsInclude,
				// orderBy: { [sortBy||'createdAt']: sortOrder },
				orderBy,
			}),
			prisma_DB.coupon.count({ where }),
		]);

		const data = await Promise.all(coupons.map((c) => formatCoupon(c, locale)));

		return {
			success: true,
			status: 200,
			data,
			meta: {
				pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
				sort: { by: sortBy, order: sortOrder },
			},
		};
	} catch (error) {
		logger.error('Error fetching coupons', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.fetch_failed', 500);
	}
}

/** 🔹 Get Coupon By ID (for editing) */
export async function getCoupon(id: string, locale?: string): Promise<ActionResult<ICouponForm>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	const coupon = await prisma_DB.coupon.findUnique({
		where: { id },
		include: couponWithRelationsInclude,
	});

	if (!coupon) throw new AppError('api.coupons.errors.not_found', 404);

	const data = await formatCouponForEdit(coupon, locale);
	return { success: true, status: 200, data };
}

/** 🔹 Get Coupon By Code */
export async function getCouponByCode(code: string, locale?: string): Promise<ActionResult<FormattedCoupon>> {
	if (!code) throw new AppError('api.errors.invalid_code', 400);

	const coupon = await prisma_DB.coupon.findUnique({
		where: { code: code.toUpperCase() },
		include: couponWithRelationsInclude,
	});

	if (!coupon) throw new AppError('api.coupons.errors.not_found', 404);

	const data = await formatCoupon(coupon, locale);
	return { success: true, status: 200, data };
}

/** 🔹 Validate Relations Exist */
async function validateCouponRelations(data: ICouponForm): Promise<{ success: boolean; error?: string }> {
	if (data.products?.length > 0) {
		const products = await prisma_DB.product.findMany({
			where: { id: { in: data.products } },
			select: { id: true },
		});
		if (products.length !== data.products.length) {
			return { success: false, error: 'api.errors.some_products_not_found' };
		}
	}

	if (data.categories?.length > 0) {
		const categories = await prisma_DB.category.findMany({
			where: { id: { in: data.categories } },
			select: { id: true },
		});
		if (categories.length !== data.categories.length) {
			return { success: false, error: 'api.errors.some_categories_not_found' };
		}
	}

	if (data.collections?.length > 0) {
		const collections = await prisma_DB.collection.findMany({
			where: { id: { in: data.collections } },
			select: { id: true },
		});
		if (collections.length !== data.collections.length) {
			return { success: false, error: 'api.errors.some_collections_not_found' };
		}
	}

	return { success: true };
}

/** 🔹 Check if Coupon Code Exists */
async function checkCouponCodeExists(code: string, excludeId?: string): Promise<boolean> {
	const existing = await prisma_DB.coupon.findUnique({
		where: { code: code.toUpperCase() },
		select: { id: true },
	});

	if (!existing) return false;
	if (excludeId && existing.id === excludeId) return false;
	return true;
}

/** 🟢 Create Coupon */
export async function createCoupon(data: ICouponForm): Promise<ActionResult<ICouponForm>> {
	try {
		const validation = await ValidateFormAction(formSchemaCoupon, data);
		if (!validation.success) {
			return {
				success: false,
				status: 400,
				data: {} as ICouponForm,
				form_errors: JSON.stringify(validation.form_errors),
				error: 'api.errors.inputs_validation',
			};
		}

		const codeExists = await checkCouponCodeExists(data.code);
		if (codeExists) {
			return {
				success: false,
				status: 400,
				data: {} as ICouponForm,
				form_errors: JSON.stringify({ code: ['api.coupons.errors.code_exists'] }),
				error: 'api.errors.inputs_validation',
			};
		}

		const relationsValidation = await validateCouponRelations(data);
		if (!relationsValidation.success) {
			return {
				success: false,
				status: 400,
				data: {} as ICouponForm,
				form_errors: JSON.stringify({ relations: [relationsValidation.error] }),
				error: 'api.errors.inputs_validation',
			};
		}

		const startDate = new Date(data.startDate);
		const endDate = data.endDate ? new Date(data.endDate) : null;
		const minPurchaseAmount = data.minPurchaseAmount && data.minPurchaseAmount > 0 ? data.minPurchaseAmount : null;
		const maxDiscountAmount = data.maxDiscountAmount && data.maxDiscountAmount > 0 ? data.maxDiscountAmount : null;
		const usageLimit = data.usageLimit && data.usageLimit > 0 ? data.usageLimit : null;
		const usagePerUser = data.usagePerUser && data.usagePerUser > 0 ? data.usagePerUser : null;

		const coupon = await prisma_DB.coupon.create({
			data: {
				code: data.code.toUpperCase(),
				type: data.type,
				value: data.value,
				applicableOn: data.applicableOn,
				minPurchaseAmount,
				maxDiscountAmount,
				usageLimit,
				usagePerUser,
				startDate,
				endDate,
				isActive: data.isActive ?? true,
				isPublic: data.isPublic ?? true,
				translations: {
					create: [
						{ lang: 'ar', name: data.name_ar, description: data.description_ar || null },
						{ lang: 'en', name: data.name_en, description: data.description_en || null },
					],
				},
				products: data.products?.length ? { create: data.products.map((id) => ({ productId: id })) } : undefined,
				categories: data.categories?.length ? { create: data.categories.map((id) => ({ categoryId: id })) } : undefined,
				collections: data.collections?.length
					? { create: data.collections.map((id) => ({ collectionId: id })) }
					: undefined,
			},
			include: couponWithRelationsInclude,
		});

		revalidatePath('/dashboard/coupons');
		revalidateTag('coupons', 'max');

		logger.info(`✅ Coupon created: ${coupon.code}`, { context: 'CouponService' });

		const formattedData = await formatCouponForEdit(coupon);

		return {
			success: true,
			status: 201,
			data: formattedData,
			message: 'api.coupons.success.create',
		};
	} catch (error) {
		logger.error('Error creating coupon', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.create_failed', 500);
	}
}

/** 🟡 Update Coupon */
export async function updateCoupon(id: string, data: ICouponForm): Promise<ActionResult<ICouponForm>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	try {
		const validation = await ValidateFormAction(formSchemaCoupon, data);
		if (!validation.success) {
			return {
				success: false,
				status: 400,
				data: {} as ICouponForm,
				form_errors: JSON.stringify(validation.form_errors),
				error: 'api.errors.inputs_validation',
			};
		}

		const existingCoupon = await prisma_DB.coupon.findUnique({
			where: { id },
			select: { id: true, code: true },
		});

		if (!existingCoupon) throw new AppError('api.coupons.errors.not_found', 404);

		if (data.code && data.code !== existingCoupon.code) {
			const codeExists = await checkCouponCodeExists(data.code, id);
			if (codeExists) {
				return {
					success: false,
					status: 400,
					data: {} as ICouponForm,
					form_errors: JSON.stringify({ code: ['api.coupons.errors.code_exists'] }),
					error: 'api.errors.inputs_validation',
				};
			}
		}

		const relationsValidation = await validateCouponRelations(data);
		if (!relationsValidation.success) {
			return {
				success: false,
				status: 400,
				data: {} as ICouponForm,
				form_errors: JSON.stringify({ relations: [relationsValidation.error] }),
				error: 'api.errors.inputs_validation',
			};
		}

		const startDate = new Date(data.startDate);
		const endDate = data.endDate ? new Date(data.endDate) : null;
		const minPurchaseAmount = data.minPurchaseAmount && data.minPurchaseAmount > 0 ? data.minPurchaseAmount : null;
		const maxDiscountAmount = data.maxDiscountAmount && data.maxDiscountAmount > 0 ? data.maxDiscountAmount : null;
		const usageLimit = data.usageLimit && data.usageLimit > 0 ? data.usageLimit : null;
		const usagePerUser = data.usagePerUser && data.usagePerUser > 0 ? data.usagePerUser : null;

		const coupon = await prisma_DB.coupon.update({
			where: { id },
			data: {
				code: data.code?.toUpperCase(),
				type: data.type,
				value: data.value,
				applicableOn: data.applicableOn,
				minPurchaseAmount,
				maxDiscountAmount,
				usageLimit,
				usagePerUser,
				startDate,
				endDate,
				isActive: data.isActive ?? true,
				isPublic: data.isPublic ?? true,
				translations: {
					deleteMany: {},
					create: [
						{ lang: 'ar', name: data.name_ar, description: data.description_ar || null },
						{ lang: 'en', name: data.name_en, description: data.description_en || null },
					],
				},
				products: {
					deleteMany: {},
					...(data.products?.length && { create: data.products.map((id) => ({ productId: id })) }),
				},
				categories: {
					deleteMany: {},
					...(data.categories?.length && { create: data.categories.map((id) => ({ categoryId: id })) }),
				},
				collections: {
					deleteMany: {},
					...(data.collections?.length && { create: data.collections.map((id) => ({ collectionId: id })) }),
				},
			},
			include: couponWithRelationsInclude,
		});

		revalidateTag('coupons', 'max');

		const formattedData = await formatCouponForEdit(coupon);
		logger.info(`✅ Coupon updated: ${coupon.code}`, { context: 'CouponService' });

		return {
			success: true,
			status: 200,
			data: formattedData,
			message: 'api.coupons.success.update',
		};
	} catch (error) {
		logger.error('Error updating coupon', { error, context: 'CouponService' });
		if (error instanceof AppError) throw error;
		throw new AppError('api.coupons.errors.update_failed', 500);
	}
}

/** 🟢 Toggle Active */
export async function toggleStateCoupon(
	id: string,
	isActive: boolean,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	try {
		const updated = await prisma_DB.coupon.update({
			where: { id },
			data: { isActive },
			select: { id: true, isActive: true },
		});

		revalidateTag('coupons', 'max');
		return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
	} catch (error) {
		logger.error('Error toggling coupon state', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.toggle_failed', 500);
	}
}

/** 🔴 Delete */
export async function deleteCoupon(id: string): Promise<ActionResult<null>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	try {
		await prisma_DB.coupon.delete({ where: { id } });
		revalidateTag('coupons', 'max');
		logger.info(`✅ Coupon deleted: ${id}`, { context: 'CouponService' });
		return { success: true, status: 200, data: null, message: 'api.coupons.success.delete' };
	} catch (error) {
		logger.error('Error deleting coupon', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.delete_failed', 500);
	}
}

/** 🔴 Delete Many */
export async function deleteManyCoupons(ids: string[]): Promise<ActionResult<null>> {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	try {
		const deleted = await prisma_DB.coupon.deleteMany({ where: { id: { in: ids } } });
		if (!deleted.count) throw new AppError('api.coupons.errors.no_records_deleted', 404);

		revalidateTag('coupons', 'max');
		logger.info(`✅ ${deleted.count} coupons deleted`, { context: 'CouponService' });
		return { success: true, status: 200, data: null, message: 'api.coupons.success.delete_many' };
	} catch (error) {
		logger.error('Error deleting multiple coupons', { error, context: 'CouponService' });
		if (error instanceof AppError) throw error;
		throw new AppError('api.coupons.errors.delete_many_failed', 500);
	}
}

/** 🔹 Validate Coupon */
export async function validateCoupon(
	code: string,
	userId?: string,
	cartItems?: { productId: string; categoryId?: string; collectionIds?: string[] }[],
	subtotal?: number,
): Promise<ActionResult<CouponValidation>> {
	try {
		// ⚡ OPTIMIZATION: Select only 'id' for coupon usages to prevent heavy payload memory bloat
		const coupon = await prisma_DB.coupon.findUnique({
			where: { code: code.toUpperCase() },
			include: {
				products: { select: { productId: true } },
				categories: { select: { categoryId: true } },
				collections: { select: { collectionId: true } },
				usages: userId ? { where: { userId }, select: { id: true } } : undefined,
			},
		});

		if (!coupon) {
			return {
				success: false,
				status: 404,
				data: { isValid: false, message: 'api.coupons.errors.not_found', errors: ['api.coupons.errors.not_found'] },
			};
		}

		const errors: string[] = [];
		const now = new Date();

		if (!coupon.isActive) errors.push('api.coupons.errors.inactive');
		if (now < coupon.startDate) errors.push('api.coupons.errors.not_started');
		if (coupon.endDate && now > coupon.endDate) errors.push('api.coupons.errors.expired');
		if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) errors.push('api.coupons.errors.usage_limit_reached');
		if (userId && coupon.usagePerUser && coupon.usages && coupon.usages.length >= coupon.usagePerUser) {
			errors.push('api.coupons.errors.user_limit_reached');
		}
		if (subtotal !== undefined && coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
			errors.push('api.coupons.errors.min_purchase_not_met');
		}

		if (cartItems?.length && !(await checkCouponApplicability(coupon, cartItems))) {
			errors.push('api.coupons.errors.not_applicable');
		}

		const isValid = errors.length === 0;

		return {
			success: true,
			status: 200,
			data: {
				isValid,
				message: isValid ? 'api.coupons.success.valid' : errors[0],
				errors: errors.length ? errors : undefined,
			},
		};
	} catch (error) {
		logger.error('Error validating coupon', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.validation_failed', 500);
	}
}

/** 🔹 Apply Coupon to Cart */
export async function applyCoupon(request: ApplyCouponRequest, locale?: string): Promise<ActionResult<CouponValidation>> {
	try {
		const { couponCode, userId, cartItems, subtotal } = request;

		const validation = await validateCoupon(couponCode, userId, cartItems, subtotal);
		if (!validation.success || !(validation.data as CouponValidation)?.isValid) return validation;

		const couponResult = await getCouponByCode(couponCode, locale);
		if (!couponResult.success || !couponResult.data) {
			return { success: false, status: 404, data: { isValid: false, message: 'api.coupons.errors.not_found' } };
		}

		// ⚡ OPTIMIZATION: Cleaned up the redundant array check type-guard safely
		const coupon = couponResult.data as FormattedCoupon;
		if (!coupon) {
			return { success: false, status: 404, data: { isValid: false, message: 'api.coupons.errors.not_found' } };
		}

		const discountAmount = calculateCouponDiscount(
			{ type: coupon.type, value: coupon.value, maxDiscountAmount: coupon.maxDiscountAmount },
			subtotal,
		);

		return {
			success: true,
			status: 200,
			data: {
				isValid: true,
				message: 'api.coupons.success.applied',
				discount: discountAmount,
				finalAmount: Math.max(0, subtotal - discountAmount),
			},
		};
	} catch (error) {
		logger.error('Error applying coupon', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.apply_failed', 500, error);
	}
}

/** 🔹 Record Coupon Usage */
export async function recordCouponUsage(
	couponCode: string,
	userId: string | null,
	orderId: string,
	discountAmount: number,
): Promise<ActionResult<null>> {
	try {
		const coupon = await prisma_DB.coupon.findUnique({
			where: { code: couponCode.toUpperCase() },
			select: { id: true },
		});

		if (!coupon) throw new AppError('api.coupons.errors.not_found', 404);

		// ⚡ CRITICAL FIX: Avoid race conditions by using database atomic increments
		await prisma_DB.$transaction([
			prisma_DB.couponUsage.create({
				data: { couponId: coupon.id, userId: userId || undefined, orderId, discount: discountAmount },
			}),
			prisma_DB.coupon.update({
				where: { id: coupon.id },
				data: { usedCount: { increment: 1 } },
			}),
		]);

		revalidateTag('coupons', 'max');
		logger.info(`✅ Coupon usage recorded: ${couponCode} for order ${orderId}`, { context: 'CouponService' });
		return { success: true, status: 200, data: null, message: 'api.coupons.success.usage_recorded' };
	} catch (error) {
		logger.error('Error recording coupon usage', { error, context: 'CouponService' });
		if (error instanceof AppError) throw error;
		throw new AppError('api.coupons.errors.usage_record_failed', 500);
	}
}

/** 🔹 Get Coupon Statistics */
export async function getCouponStatistics(): Promise<ActionResult<CouponStatistics>> {
	try {
		const now = new Date();

		const [totalCoupons, activeCoupons, expiredCoupons, usageStats] = await Promise.all([
			prisma_DB.coupon.count(),
			prisma_DB.coupon.count({
				where: {
					isActive: true,
					startDate: { lte: now },
					OR: [{ endDate: null }, { endDate: { gte: now } }],
				},
			}),
			prisma_DB.coupon.count({
				where: {
					endDate: { lt: now },
				},
			}),
			prisma_DB.couponUsage.aggregate({
				_sum: { discount: true },
				_count: true,
			}),
		]);

		const totalUsages = usageStats._count || 0;
		const totalDiscount = usageStats._sum.discount || 0;
		const averageDiscountPerUse = totalUsages > 0 ? totalDiscount / totalUsages : 0;

		const mostUsed = await prisma_DB.coupon.findFirst({
			where: { usedCount: { gt: 0 } },
			orderBy: { usedCount: 'desc' },
			select: { code: true, usedCount: true },
		});

		return {
			success: true,
			status: 200,
			data: {
				totalCoupons,
				activeCoupons,
				expiredCoupons,
				totalUsages,
				totalDiscount: Math.round(totalDiscount * 100) / 100,
				averageDiscountPerUse: Math.round(averageDiscountPerUse * 100) / 100,
				mostUsedCoupon: mostUsed
					? {
							code: mostUsed.code,
							usages: mostUsed.usedCount,
						}
					: undefined,
			},
		};
	} catch (error) {
		logger.error('Error fetching coupon statistics', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.stats_failed', 500);
	}
}

/** 🔹 Get User Coupon Usage */
export async function getUserCouponUsage(userId: string, couponId: string): Promise<ActionResult<number>> {
	try {
		const count = await prisma_DB.couponUsage.count({
			where: {
				userId,
				couponId,
			},
		});

		return { success: true, status: 200, data: count };
	} catch (error) {
		logger.error('Error fetching user coupon usage', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.usage_fetch_failed', 500);
	}
}

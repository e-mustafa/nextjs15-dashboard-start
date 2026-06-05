'use server';
import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { fields, formSchemaCoupon, TCouponFormValues } from '@/validation/coupon-validation';
import { CouponApplicableOn, CouponType, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { calculateCouponDiscount } from './utils';

// ✅ Updated Types with Translations
export type CouponWithRelations = Prisma.CouponGetPayload<{
	include: {
		translations: true;
		products: {
			include: {
				product: {
					include: {
						translations: true;
						images: { include: { image: true } };
					};
				};
			};
		};
		categories: {
			include: {
				category: {
					include: {
						translations: true;
						images: { include: { image: true } };
					};
				};
			};
		};
		collections: {
			include: {
				collection: {
					include: {
						translations: true;
						images: { include: { image: true } };
					};
				};
			};
		};
		usages: true;
	};
}>;

export interface CouponProduct {
	id: string;
	name: string;
	basePrice: number;
	image?: string;
}

export interface CouponCategory {
	id: string;
	name: string;
	image?: string;
}

export interface CouponCollection {
	id: string;
	name: string;
	image?: string;
}

export interface FormattedCoupon {
	id: string;
	code: string;
	name: string;
	description?: string;
	type: CouponType;
	value: number;
	applicableOn: CouponApplicableOn;
	minPurchaseAmount: number | null;
	maxDiscountAmount: number | null;
	usageLimit: number | null;
	usagePerUser: number | null;
	usedCount: number;
	remainingUses: number | null;
	startDate: string;
	endDate: string | null;
	isActive: boolean;
	isPublic: boolean;
	isValid: boolean;
	isExpired: boolean;
	totalProducts: number;
	totalCategories: number;
	totalCollections: number;
	createdAt: string;
	updatedAt: string;
	products: string[];
	categories: string[];
	collections: string[];
}

// export interface ICouponForm extends Omit<FormattedCoupon, 'name' | 'description'> {
// 	name_ar: string;
// 	name_en: string;
// 	description_ar?: string | null | undefined;
// 	description_en?: string | null | undefined;
// 	initialItems?: {
// 		products: CouponProduct[];
// 		categories: CouponCategory[];
// 		collections: CouponCollection[];
// 	};
// }

export type ICouponForm = TCouponFormValues;

export interface CouponValidation {
	isValid: boolean;
	message?: string;
	discount?: number;
	finalAmount?: number;
	errors?: string[];
}

export interface ApplyCouponRequest {
	couponCode: string;
	userId?: string;
	cartItems: { productId: string; categoryId?: string; collectionIds?: string[] }[];
	subtotal: number;
}

/** 🔹 Format Single Product for Coupon */
async function formatCouponProduct(
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
async function formatCouponCategory(
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
async function formatCouponCollection(
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

async function handleCouponData(coupon: CouponWithRelations, locale?: string) {
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
async function formatCoupon(coupon: CouponWithRelations, locale?: string): Promise<FormattedCoupon> {
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
async function formatCouponForEdit(coupon: CouponWithRelations, locale?: string): Promise<ICouponForm> {
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
		const page = Math.max(1, Number(params?.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10));
		const search = params?.search?.trim() || '';
		const skip = (page - 1) * limit;

		const sortableFields = ['code', 'startDate', 'endDate', 'usedCount', 'createdAt'];
		const sortBy = sortableFields.includes(params?.sortBy || '') ? (params?.sortBy as string) : 'createdAt';
		const sortOrder = params?.sortOrder === 'asc' ? 'asc' : 'desc';

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
				include: {
					translations: true,
					products: {
						include: {
							product: {
								select: {
									id: true,
									basePrice: true,
									translations: true,
									images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
								},
							},
						},
					},
					categories: {
						include: {
							category: {
								select: {
									id: true,
									translations: true,
									images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
								},
							},
						},
					},
					collections: {
						include: {
							collection: {
								select: {
									id: true,
									translations: true,
									images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
								},
							},
						},
					},
					usages: true,
				},
				orderBy: { [sortBy]: sortOrder },
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
		include: {
			translations: true,
			products: {
				include: {
					product: {
						select: {
							id: true,
							basePrice: true,
							translations: true,
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
			categories: {
				include: {
					category: {
						select: {
							id: true,
							translations: true,
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
			collections: {
				include: {
					collection: {
						select: {
							id: true,
							translations: true,
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
			usages: true,
		},
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
		include: {
			translations: true,
			products: {
				include: {
					product: {
						select: {
							id: true,
							basePrice: true,
							translations: true,
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
			categories: {
				include: {
					category: {
						select: {
							id: true,
							translations: true,
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
			collections: {
				include: {
					collection: {
						select: {
							id: true,
							translations: true,
							images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
						},
					},
				},
			},
			usages: true,
		},
	});

	if (!coupon) throw new AppError('api.coupons.errors.not_found', 404);

	const data = await formatCoupon(coupon, locale);
	return { success: true, status: 200, data };
}

/** 🔹 Validate Relations Exist */
async function validateCouponRelations(data: TCouponFormValues): Promise<{ success: boolean; error?: string }> {
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
export async function createCoupon(data: TCouponFormValues): Promise<ActionResult<ICouponForm>> {
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
				// ✅ Create translations
				translations: {
					create: [
						{ lang: 'ar', name: data.name_ar, description: data.description_ar || null },
						{ lang: 'en', name: data.name_en, description: data.description_en || null },
					],
				},
				// ✅ Create relations
				products: data.products?.length ? { create: data.products.map((id) => ({ productId: id })) } : undefined,
				categories: data.categories?.length ? { create: data.categories.map((id) => ({ categoryId: id })) } : undefined,
				collections: data.collections?.length
					? { create: data.collections.map((id) => ({ collectionId: id })) }
					: undefined,
			},
			include: {
				translations: true,
				products: {
					include: {
						product: {
							select: {
								id: true,
								basePrice: true,
								translations: true,
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
				categories: {
					include: {
						category: {
							select: {
								id: true,
								translations: true,
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
				collections: {
					include: {
						collection: {
							select: {
								id: true,
								translations: true,
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
				usages: true,
			},
		});

		revalidatePath('/dashboard/coupons');
		revalidateTag('coupons', 'max');

		logger.info(`✅ Coupon created: ${coupon.code}`, { context: 'CouponService' });

		// const formattedData = await formatCoupon(coupon );
		const formattedData = await formatCouponForEdit(coupon as CouponWithRelations);

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
export async function updateCoupon(id: string, data: TCouponFormValues): Promise<ActionResult<ICouponForm>> {
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
				// ✅ Update translations
				translations: {
					deleteMany: {},
					create: [
						{ lang: 'ar', name: data.name_ar, description: data.description_ar || null },
						{ lang: 'en', name: data.name_en, description: data.description_en || null },
					],
				},
				// ✅ Update relations
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
			include: {
				translations: true,
				products: {
					include: {
						product: {
							select: {
								id: true,
								basePrice: true,
								translations: true,
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
				categories: {
					include: {
						category: {
							select: {
								id: true,
								translations: true,
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
				collections: {
					include: {
						collection: {
							select: {
								id: true,
								translations: true,
								images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
							},
						},
					},
				},
				usages: true,
			},
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
		const coupon = await prisma_DB.coupon.findUnique({
			where: { code: code.toUpperCase() },
			include: {
				products: { select: { productId: true } },
				categories: { select: { categoryId: true } },
				collections: { select: { collectionId: true } },
				usages: userId ? { where: { userId } } : undefined,
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

/** 🔹 Check Coupon Applicability */
async function checkCouponApplicability(
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

		const couponData = couponResult.data;
		const coupon = Array.isArray(couponData) ? couponData[0] : couponData;
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
			select: { id: true, usedCount: true },
		});

		if (!coupon) throw new AppError('api.coupons.errors.not_found', 404);

		await prisma_DB.$transaction([
			prisma_DB.couponUsage.create({
				data: { couponId: coupon.id, userId: userId || undefined, orderId, discount: discountAmount },
			}),
			prisma_DB.coupon.update({ where: { id: coupon.id }, data: { usedCount: coupon.usedCount + 1 } }),
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
export async function getCouponStatistics(): Promise<ActionResult<any>> {
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

		// Get most used coupon
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

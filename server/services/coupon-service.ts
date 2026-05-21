'use server';
import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
// import type {
// 	ApplyCouponRequest,
// 	CouponCategory,
// 	CouponCollection,
// 	CouponProduct,
// 	CouponValidation,
// 	CouponWithRelations,
// 	FormattedCoupon,
// } from '@/types/coupon.types';
import { formSchemaCoupon, TCouponFormValues } from '@/validation/coupon-validation';
import { CouponApplicableOn, CouponType, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';

let user: { id: string; name: string } | null = null;

// coupon.types.ts

import { TImage } from '@/types/api';
import { calculateCouponDiscount } from './utils';

// ✅ Type للكوبون مع العلاقات الكاملة
export type CouponWithRelations = Prisma.CouponGetPayload<{
	include: {
		products: {
			include: {
				product: {
					include: {
						translations: true;
						images: {
							include: {
								image: true;
							};
						};
					};
				};
			};
		};
		categories: {
			include: {
				category: {
					include: {
						translations: true;
						images: {
							include: {
								image: true;
							};
						};
					};
				};
			};
		};
		collections: {
			include: {
				collection: {
					include: {
						translations: true;
						images: {
							include: {
								image: true;
							};
						};
					};
				};
			};
		};
		usages: true;
	};
}>;

// ✅ Type للمنتج المرتبط بالكوبون
export interface CouponProduct {
	id: string;
	name: string;
	basePrice: number;
	image?: TImage;
}

// ✅ Type للفئة المرتبطة بالكوبون
export interface CouponCategory {
	id: string;
	name: string;
	image?: TImage;
}

// ✅ Type للمجموعة المرتبطة بالكوبون
export interface CouponCollection {
	id: string;
	name: string;
	image?: TImage;
}

// ✅ Type للكوبون المنسق (بعد formatCoupon)
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
	products: CouponProduct[];
	categories: CouponCategory[];
	collections: CouponCollection[];
	totalProducts: number;
	totalCategories: number;
	totalCollections: number;
	createdAt: string;
	updatedAt: string;
}

// ✅ Type للتحقق من صلاحية الكوبون
export interface CouponValidation {
	isValid: boolean;
	message?: string;
	discount?: number;
	finalAmount?: number;
	errors?: string[];
}

// ✅ Type لحساب الخصم
export interface CouponCalculation {
	originalAmount: number;
	discountAmount: number;
	finalAmount: number;
	couponCode: string;
	couponType: CouponType;
	couponValue: number;
}

// ✅ Type لإحصائيات الكوبون
export interface CouponStatistics {
	totalCoupons: number;
	activeCoupons: number;
	expiredCoupons: number;
	totalUsages: number;
	totalDiscount: number;
	averageDiscountPerUse: number;
	mostUsedCoupon?: {
		code: string;
		usages: number;
	};
}

// ✅ Type لتطبيق الكوبون على السلة
export interface ApplyCouponRequest {
	couponCode: string;
	userId?: string;
	cartItems: {
		productId: string;
		quantity: number;
		price: number;
	}[];
	subtotal: number;
}

// ✅ Constants
// export const COUPON_CONSTANTS = {
// 	CODE_MIN_LENGTH: 3,
// 	CODE_MAX_LENGTH: 50,
// 	MAX_PERCENTAGE: 100,
// 	MIN_PERCENTAGE: 0,
// 	MIN_FIXED_VALUE: 0,
// 	DEFAULT_USAGE_LIMIT: null,
// 	DEFAULT_USAGE_PER_USER: 1,
// } as const;

// ✅ Coupon Error Messages
// export const COUPON_ERRORS = {
// 	NOT_FOUND: 'api.coupons.errors.not_found',
// 	EXPIRED: 'api.coupons.errors.expired',
// 	NOT_STARTED: 'api.coupons.errors.not_started',
// 	INACTIVE: 'api.coupons.errors.inactive',
// 	USAGE_LIMIT_REACHED: 'api.coupons.errors.usage_limit_reached',
// 	USER_LIMIT_REACHED: 'api.coupons.errors.user_limit_reached',
// 	MIN_PURCHASE_NOT_MET: 'api.coupons.errors.min_purchase_not_met',
// 	NOT_APPLICABLE: 'api.coupons.errors.not_applicable',
// 	INVALID_CODE: 'api.coupons.errors.invalid_code',
// } as const;

/** 🔹 Format Single Product for Coupon */
async function formatCouponProduct(
	productRelation: CouponWithRelations['products'][0],
	locale?: string,
): Promise<CouponProduct> {
	const { product } = productRelation;

	// Get product name from translations
	let productName = '';
	if (product.translations && product.translations.length > 0) {
		const productTranslation = await mapTranslations(product.translations, {
			accept_language: locale,
			fields: ['name'],
			enableFallback: true,
		});
		// productName = (productTranslation as { name?: string }).name || '';
		productName = productTranslation.name || '';
	}

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
	if (category.translations && category.translations.length > 0) {
		const categoryTranslation = await mapTranslations(category.translations, {
			accept_language: locale,
			fields: ['name'],
			enableFallback: true,
		});
		categoryName = (categoryTranslation as { name?: string }).name || '';
	}

	const firstImage =
		category.images && category.images.length > 0
			? {
					url: category.images[0].image?.url || '',
					fileId: category.images[0].image?.fileId || '',
				}
			: undefined;

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
	if (collection.translations && collection.translations.length > 0) {
		const collectionTranslation = await mapTranslations(collection.translations, {
			accept_language: locale,
			fields: ['name'],
			enableFallback: true,
		});
		collectionName = (collectionTranslation as { name?: string }).name || '';
	}

	const firstImage =
		collection.images && collection.images.length > 0
			? {
					url: collection.images[0].image?.url || '',
					fileId: collection.images[0].image?.fileId || '',
				}
			: undefined;

	return {
		id: collection.id,
		name: collectionName,
		image: firstImage,
	};
}

/** 🔹 Format Coupon */
async function formatCoupon(coupon: CouponWithRelations, locale?: string): Promise<FormattedCoupon> {
	const {
		name_ar,
		name_en,
		description_ar,
		description_en,
		products,
		categories,
		collections,
		startDate,
		endDate,
		createdAt,
		updatedAt,
		...rest
	} = coupon;

	// Format products, categories, collections
	const formattedProducts = await Promise.all(products?.map((p) => formatCouponProduct(p, locale)));
	const formattedCategories = await Promise.all(categories?.map((c) => formatCouponCategory(c, locale)));
	const formattedCollections = await Promise.all(collections?.map((c) => formatCouponCollection(c, locale)));

	// Check if coupon is valid and expired
	const now = new Date();
	const isExpired = endDate ? now > endDate : false;
	const isStarted = now >= startDate;
	const hasUsesLeft = rest.usageLimit ? rest.usedCount < rest.usageLimit : true;
	const isValid = rest.isActive && isStarted && !isExpired && hasUsesLeft;

	const remainingUses = rest.usageLimit ? rest.usageLimit - rest.usedCount : null;

	return {
		...rest,
		name: locale?.startsWith('ar') ? name_ar || name_en : name_en || name_ar,
		description: locale?.startsWith('ar')
			? description_ar || description_en || ''
			: description_en || description_ar || '',
		startDate: startDate.toISOString(),
		endDate: endDate ? endDate.toISOString() : null,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
		products: formattedProducts,
		categories: formattedCategories,
		collections: formattedCollections,
		totalProducts: formattedProducts.length,
		totalCategories: formattedCategories.length,
		totalCollections: formattedCollections.length,
		remainingUses,
		isValid,
		isExpired,
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
		// const cookiesStore = await cookies();
		// const userCookie = cookiesStore.get('user')?.value;
		// if (userCookie) {
		// 	try {
		// 		user = JSON.parse(userCookie);
		// 	} catch {
		// 		user = null;
		// 	}
		// }

		const page = Math.max(1, Number(params?.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10));
		const search = params?.search?.trim() || '';
		const skip = (page - 1) * limit;

		const sortableFields = ['code', 'name_ar', 'name_en', 'startDate', 'endDate', 'usedCount', 'createdAt'];
		const sortBy = sortableFields.includes(params?.sortBy || '') ? (params?.sortBy as string) : 'createdAt';
		const sortOrder = params?.sortOrder === 'asc' ? 'asc' : 'desc';

		const now = new Date();

		const where: Prisma.CouponWhereInput = {
			...(search && {
				OR: [
					{ code: { contains: search, mode: 'insensitive' } },
					{ name_ar: { contains: search, mode: 'insensitive' } },
					{ name_en: { contains: search, mode: 'insensitive' } },
				],
			}),
			...(params?.type && { type: params.type }),
			...(params?.applicableOn && { applicableOn: params.applicableOn }),
			...(params?.isActive !== undefined && { isActive: params.isActive }),
			...(params?.isPublic !== undefined && { isPublic: params.isPublic }),
			...(params?.isExpired === true && { endDate: { lt: now } }),
			...(params?.isExpired === false && {
				OR: [{ endDate: null }, { endDate: { gte: now } }],
			}),
		};

		const [coupons, total] = await Promise.all([
			prisma_DB.coupon.findMany({
				where,
				skip,
				take: limit,
				include: {
					products: true,
					categories: true,
					collections: true,
					// products: {
					// 	include: {
					// 		product: {
					// 			include: {
					// 				translations: true,
					// 				images: {
					// 					include: { image: true },
					// 					orderBy: { sortOrder: 'asc' },
					// 					take: 1,
					// 				},
					// 			},
					// 		},
					// 	},
					// },
					// categories: {
					// 	include: {
					// 		category: {
					// 			include: {
					// 				translations: true,
					// 				images: {
					// 					include: { image: true },
					// 					orderBy: { sortOrder: 'asc' },
					// 					take: 1,
					// 				},
					// 			},
					// 		},
					// 	},
					// },
					// collections: {
					// 	include: {
					// 		collection: {
					// 			include: {
					// 				translations: true,
					// 				images: {
					// 					include: { image: true },
					// 					orderBy: { sortOrder: 'asc' },
					// 					take: 1,
					// 				},
					// 			},
					// 		},
					// 	},
					// },
					usages: true,
				},
				orderBy: { [sortBy]: sortOrder },
			}),
			prisma_DB.coupon.count({ where }),
		]);

		const data = await Promise.all(coupons?.map((c) => formatCoupon(c as CouponWithRelations, locale)));

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

/** 🔹 Get Coupon By ID */
export async function getCoupon(id: string, locale?: string): Promise<ActionResult<CouponWithRelations>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	const coupon = await prisma_DB.coupon.findUnique({
		where: { id },
		include: {
			products: {
				include: {
					product: {
						include: {
							translations: true,
							images: {
								include: { image: true },
								orderBy: { sortOrder: 'asc' },
								take: 1,
							},
						},
					},
				},
			},
			categories: {
				include: {
					category: {
						include: {
							translations: true,
							images: {
								include: { image: true },
								orderBy: { sortOrder: 'asc' },
								take: 1,
							},
						},
					},
				},
			},
			collections: {
				include: {
					collection: {
						include: {
							translations: true,
							images: {
								include: { image: true },
								orderBy: { sortOrder: 'asc' },
								take: 1,
							},
						},
					},
				},
			},
			usages: true,
		},
	});

	if (!coupon) throw new AppError('api.coupons.errors.not_found', 404);

	// const data = await formatCoupon(coupon, locale);
	return { success: true, status: 200, data: coupon };
}

/** 🔹 Get Coupon By Code */
export async function getCouponByCode(code: string, locale?: string): Promise<ActionResult<FormattedCoupon>> {
	if (!code) throw new AppError('api.errors.invalid_code', 400);

	const coupon = await prisma_DB.coupon.findUnique({
		where: { code: code.toUpperCase() },
		include: {
			products: {
				include: {
					product: {
						include: {
							translations: true,
							images: {
								include: { image: true },
								orderBy: { sortOrder: 'asc' },
								take: 1,
							},
						},
					},
				},
			},
			categories: {
				include: {
					category: {
						include: {
							translations: true,
							images: {
								include: { image: true },
								orderBy: { sortOrder: 'asc' },
								take: 1,
							},
						},
					},
				},
			},
			collections: {
				include: {
					collection: {
						include: {
							translations: true,
							images: {
								include: { image: true },
								orderBy: { sortOrder: 'asc' },
								take: 1,
							},
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

// تابع coupon.service.ts - CRUD Operations

/** 🔹 Validate Relations Exist */
async function validateCouponRelations(data: TCouponFormValues): Promise<{ success: boolean; error?: string }> {
	// Validate products
	if (data.products && data.products.length > 0) {
		const products = await prisma_DB.product.findMany({
			where: { id: { in: data.products } },
			select: { id: true },
		});
		if (products.length !== data.products.length) {
			return { success: false, error: 'api.errors.some_products_not_found' };
		}
	}

	// Validate categories
	if (data.categories && data.categories.length > 0) {
		const categories = await prisma_DB.category.findMany({
			where: { id: { in: data.categories } },
			select: { id: true },
		});
		if (categories.length !== data.categories.length) {
			return { success: false, error: 'api.errors.some_categories_not_found' };
		}
	}

	// Validate collections
	if (data.collections && data.collections.length > 0) {
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
export async function createCoupon(data: TCouponFormValues): Promise<ActionResult<FormattedCoupon>> {
	try {
		const validation = await ValidateFormAction(formSchemaCoupon, data);
		if (!validation.success) {
			return {
				success: false,
				status: 400,
				data: {} as FormattedCoupon,
				form_errors: JSON.stringify(validation.form_errors),
				error: 'api.errors.inputs_validation',
			};
		}

		// Check if code already exists
		const codeExists = await checkCouponCodeExists(data.code);
		if (codeExists) {
			return {
				success: false,
				status: 400,
				data: {} as FormattedCoupon,
				form_errors: JSON.stringify({ code: ['api.coupons.errors.code_exists'] }),
				error: 'api.errors.inputs_validation',
			};
		}

		// Validate relations
		const relationsValidation = await validateCouponRelations(data);
		if (!relationsValidation.success) {
			return {
				success: false,
				status: 400,
				data: {} as FormattedCoupon,
				form_errors: JSON.stringify({ relations: [relationsValidation.error] }),
				error: 'api.errors.inputs_validation',
			};
		}

		const startDate = new Date(data.startDate);
		const endDate = data.endDate ? new Date(data.endDate) : null;

		// Normalize values
		const minPurchaseAmount = data.minPurchaseAmount && data.minPurchaseAmount > 0 ? data.minPurchaseAmount : null;
		const maxDiscountAmount = data.maxDiscountAmount && data.maxDiscountAmount > 0 ? data.maxDiscountAmount : null;
		const usageLimit = data.usageLimit && data.usageLimit > 0 ? data.usageLimit : null;
		const usagePerUser = data.usagePerUser && data.usagePerUser > 0 ? data.usagePerUser : null;

		// Create coupon
		const coupon = await prisma_DB.coupon.create({
			data: {
				code: data.code.toUpperCase(),
				name_ar: data.name_ar,
				name_en: data.name_en,
				description_ar: data.description_ar || null,
				description_en: data.description_en || null,
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
				// Create relations
				products: data.products?.length
					? {
							create: data.products.map((productId) => ({ productId })),
						}
					: undefined,
				categories: data.categories?.length
					? {
							create: data.categories.map((categoryId) => ({ categoryId })),
						}
					: undefined,
				collections: data.collections?.length
					? {
							create: data.collections.map((collectionId) => ({ collectionId })),
						}
					: undefined,
			},
			include: {
				products: {
					include: {
						product: {
							include: {
								translations: true,
								images: {
									include: { image: true },
									orderBy: { sortOrder: 'asc' },
									take: 1,
								},
							},
						},
					},
				},
				categories: {
					include: {
						category: {
							include: {
								translations: true,
								images: {
									include: { image: true },
									orderBy: { sortOrder: 'asc' },
									take: 1,
								},
							},
						},
					},
				},
				collections: {
					include: {
						collection: {
							include: {
								translations: true,
								images: {
									include: { image: true },
									orderBy: { sortOrder: 'asc' },
									take: 1,
								},
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

		const formattedData = await formatCoupon(coupon);

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
export async function updateCoupon(id: string, data: Partial<TCouponFormValues>): Promise<ActionResult<FormattedCoupon>> {
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	try {
		const validation = await ValidateFormAction(formSchemaCoupon, data);
		if (!validation.success) {
			return {
				success: false,
				status: 400,
				data: {} as FormattedCoupon,
				form_errors: JSON.stringify(validation.form_errors),
				error: 'api.errors.inputs_validation',
			};
		}

		// Check if coupon exists
		const existingCoupon = await prisma_DB.coupon.findUnique({
			where: { id },
			select: { id: true, code: true },
		});

		if (!existingCoupon) {
			throw new AppError('api.coupons.errors.not_found', 404);
		}

		// Check if code already exists (if changed)
		if (data.code && data.code !== existingCoupon.code) {
			const codeExists = await checkCouponCodeExists(data.code, id);
			if (codeExists) {
				return {
					success: false,
					status: 400,
					data: {} as FormattedCoupon,
					form_errors: JSON.stringify({ code: ['api.coupons.errors.code_exists'] }),
					error: 'api.errors.inputs_validation',
				};
			}
		}

		// Validate relations
		const relationsValidation = await validateCouponRelations(data as TCouponFormValues);
		if (!relationsValidation.success) {
			return {
				success: false,
				status: 400,
				data: {} as FormattedCoupon,
				form_errors: JSON.stringify({ relations: [relationsValidation.error] }),
				error: 'api.errors.inputs_validation',
			};
		}

		const startDate = new Date(data.startDate!);
		const endDate = data.endDate ? new Date(data.endDate) : null;

		// Normalize values
		const minPurchaseAmount = data.minPurchaseAmount && data.minPurchaseAmount > 0 ? data.minPurchaseAmount : null;
		const maxDiscountAmount = data.maxDiscountAmount && data.maxDiscountAmount > 0 ? data.maxDiscountAmount : null;
		const usageLimit = data.usageLimit && data.usageLimit > 0 ? data.usageLimit : null;
		const usagePerUser = data.usagePerUser && data.usagePerUser > 0 ? data.usagePerUser : null;

		// Update coupon
		const coupon = await prisma_DB.coupon.update({
			where: { id },
			data: {
				code: data.code?.toUpperCase(),
				name_ar: data.name_ar,
				name_en: data.name_en,
				description_ar: data.description_ar || null,
				description_en: data.description_en || null,
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
				// Update relations
				products: {
					deleteMany: {},
					...(data.products?.length && {
						create: data.products.map((productId) => ({ productId })),
					}),
				},
				categories: {
					deleteMany: {},
					...(data.categories?.length && {
						create: data.categories.map((categoryId) => ({ categoryId })),
					}),
				},
				collections: {
					deleteMany: {},
					...(data.collections?.length && {
						create: data.collections.map((collectionId) => ({ collectionId })),
					}),
				},
			},
			include: {
				products: {
					include: {
						product: {
							include: {
								translations: true,
								images: {
									include: { image: true },
									orderBy: { sortOrder: 'asc' },
									take: 1,
								},
							},
						},
					},
				},
				categories: {
					include: {
						category: {
							include: {
								translations: true,
								images: {
									include: { image: true },
									orderBy: { sortOrder: 'asc' },
									take: 1,
								},
							},
						},
					},
				},
				collections: {
					include: {
						collection: {
							include: {
								translations: true,
								images: {
									include: { image: true },
									orderBy: { sortOrder: 'asc' },
									take: 1,
								},
							},
						},
					},
				},
				usages: true,
			},
		});

		revalidateTag('coupons', 'max');

		const formattedData = await formatCoupon(coupon);
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

		return {
			success: true,
			status: 200,
			data: updated,
			message: 'api.success.update_status',
		};
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

		return {
			success: true,
			status: 200,
			data: null,
			message: 'api.coupons.success.delete',
		};
	} catch (error) {
		logger.error('Error deleting coupon', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.delete_failed', 500);
	}
}

/** 🔴 Delete Many */
export async function deleteManyCoupons(ids: string[]): Promise<ActionResult<null>> {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	try {
		const deleted = await prisma_DB.coupon.deleteMany({
			where: { id: { in: ids } },
		});

		if (!deleted.count) throw new AppError('api.coupons.errors.no_records_deleted', 404);

		revalidateTag('coupons', 'max');

		logger.info(`✅ ${deleted.count} coupons deleted`, { context: 'CouponService' });

		return {
			success: true,
			status: 200,
			data: null,
			message: 'api.coupons.success.delete_many',
		};
	} catch (error) {
		logger.error('Error deleting multiple coupons', { error, context: 'CouponService' });
		if (error instanceof AppError) throw error;
		throw new AppError('api.coupons.errors.delete_many_failed', 500);
	}
}

// تابع coupon.service.ts - Validation & Apply Logic

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
				data: {
					isValid: false,
					message: 'api.coupons.errors.not_found',
					errors: ['api.coupons.errors.not_found'],
				},
			};
		}

		const errors: string[] = [];
		const now = new Date();

		// Check if active
		if (!coupon.isActive) {
			errors.push('api.coupons.errors.inactive');
		}

		// Check if started
		if (now < coupon.startDate) {
			errors.push('api.coupons.errors.not_started');
		}

		// Check if expired
		if (coupon.endDate && now > coupon.endDate) {
			errors.push('api.coupons.errors.expired');
		}

		// Check usage limit
		if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
			errors.push('api.coupons.errors.usage_limit_reached');
		}

		// Check user usage limit
		if (userId && coupon.usagePerUser && coupon.usages) {
			const userUsageCount = coupon.usages.length;
			if (userUsageCount >= coupon.usagePerUser) {
				errors.push('api.coupons.errors.user_limit_reached');
			}
		}

		// Check minimum purchase amount
		if (subtotal !== undefined && coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
			errors.push('api.coupons.errors.min_purchase_not_met');
		}

		// Check if applicable to cart items
		if (cartItems && cartItems.length > 0) {
			const isApplicable = await checkCouponApplicability(coupon, cartItems);
			if (!isApplicable) {
				errors.push('api.coupons.errors.not_applicable');
			}
		}

		const isValid = errors.length === 0;

		return {
			success: true,
			status: 200,
			data: {
				isValid,
				message: isValid ? 'api.coupons.success.valid' : errors[0],
				errors: errors.length > 0 ? errors : undefined,
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
			const productIds = coupon.products.map((p) => p.productId);
			return cartItems.some((item) => productIds.includes(item.productId));

		case CouponApplicableOn.SPECIFIC_CATEGORIES:
			const categoryIds = coupon.categories.map((c) => c.categoryId);
			return cartItems.some((item) => item.categoryId && categoryIds.includes(item.categoryId));

		case CouponApplicableOn.SPECIFIC_COLLECTIONS:
			const collectionIds = coupon.collections.map((c) => c.collectionId);
			return cartItems.some((item) => item.collectionIds?.some((cid) => collectionIds.includes(cid)));

		case CouponApplicableOn.MINIMUM_PURCHASE:
			// Already checked in validateCoupon
			return true;

		default:
			return false;
	}
}

/** 🔹 Apply Coupon to Cart */
export async function applyCoupon(request: ApplyCouponRequest, locale?: string): Promise<ActionResult<CouponValidation>> {
	try {
		const { couponCode, userId, cartItems, subtotal } = request;

		// Validate coupon first
		const validation = await validateCoupon(couponCode, userId, cartItems, subtotal);
		const validationData = validation.data;

		if (!validation.success || !validationData || Array.isArray(validationData) || !validationData.isValid) {
			return validation;
		}

		// Get coupon details
		const couponResult = await getCouponByCode(couponCode, locale);
		if (!couponResult.success) {
			return {
				success: false,
				status: 404,
				data: {
					isValid: false,
					message: 'api.coupons.errors.not_found',
				},
			};
		}

		const couponData = couponResult.data;
		if (!couponData || Array.isArray(couponData)) {
			return {
				success: false,
				status: 404,
				data: {
					isValid: false,
					message: 'api.coupons.errors.not_found',
				},
			};
		}

		const coupon = couponData;

		// Calculate discount
		const discountAmount = calculateCouponDiscount(
			{
				type: coupon.type,
				value: coupon.value,
				maxDiscountAmount: coupon.maxDiscountAmount,
			},
			subtotal,
		);

		const finalAmount = Math.max(0, subtotal - discountAmount);

		return {
			success: true,
			status: 200,
			data: {
				isValid: true,
				message: 'api.coupons.success.applied',
				discount: discountAmount,
				finalAmount,
			},
		};
	} catch (error) {
		logger.error('Error applying coupon', { error, context: 'CouponService' });
		throw new AppError('api.coupons.errors.apply_failed', 500);
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

		if (!coupon) {
			throw new AppError('api.coupons.errors.not_found', 404);
		}

		await prisma_DB.$transaction([
			// Create usage record
			prisma_DB.couponUsage.create({
				data: {
					couponId: coupon.id,
					userId: userId || undefined,
					orderId,
					discount: discountAmount,
				},
			}),
			// Increment used count
			prisma_DB.coupon.update({
				where: { id: coupon.id },
				data: { usedCount: coupon.usedCount + 1 },
			}),
		]);

		revalidateTag('coupons', 'max');

		logger.info(`✅ Coupon usage recorded: ${couponCode} for order ${orderId}`, { context: 'CouponService' });

		return {
			success: true,
			status: 200,
			data: null,
			message: 'api.coupons.success.usage_recorded',
		};
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

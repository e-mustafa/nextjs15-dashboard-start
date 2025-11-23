'use server';

import { localesData, TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult, TImage } from '@/types/api';
import { fields, formSchemaProduct, TProductFormValues } from '@/validation/product-validation';
import { AttributeType, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';

/////////////////////////
// TYPES
/////////////////////////

type ProductWithRelations = Prisma.ProductGetPayload<{
	include: {
		translations: true;
		specifications: { include: { properties: true } };
		brand: { include: { translations: true; images: { include: { image: true } } } };
		category: { include: { translations: true; images: { include: { image: true } } } };
		// image: true;
		seoImage: true;
		images: { include: { image: true } };
		variants: {
			include: {
				image: true;
				images: { include: { image: true } };
				options: {
					include: {
						attribute: { include: { translations: true } };
						attributeValue: { include: { translations: true } };
					};
				};
			};
		};
		attributes: {
			include: {
				attribute: { include: { translations: true } };
				attributeValue: { include: { translations: true } };
			};
		};
		tags: { include: { tag: true } };
		collections: { include: { collection: { include: { translations: true; images: { include: { image: true } } } } } };
		discounts: true;
	};
}>;

export interface SpecificationProperty {
	id?: string;
	key_ar: string;
	key_en: string;
	value_ar: string;
	value_en: string;
}

export interface SpecificationSection {
	id?: string;
	title_ar: string;
	title_en: string;
	properties: SpecificationProperty[];
	// isEditing?: boolean;
}
export interface TProduct {
	id: string;
	sku: string;
	name?: string;
	slug?: string;
	description?: string;
	shortDescription?: string;
	brandId?: string | null;
	categoryId?: string | null;
	basePrice: number;
	compareAtPrice?: number | null;
	cost?: number | null;
	stockQuantity: number;
	lowStockAlert?: number | null;
	trackInventory: boolean;
	isActive: boolean;
	isFeatured: boolean;
	sortOrder: number;
	type?: string | null;
	weight?: number | null;
	length?: number | null;
	width?: number | null;
	height?: number | null;
	images?: TImage[];
	seoImage?: TImage[];
	seoTitle?: string;
	seoDescription?: string;
	seoKeywords?: string;
	createdAt?: string | Date;
	updatedAt?: string | Date;
	brand?: { id: string; name: string; image?: TImage };
	category?: { id: string; name: string; image?: TImage };
	variants?: ProductVariant[];
	specifications?: SpecificationSection[];
	collections?: Array<{ id: string; name: string; image?: TImage }>;
	tags?: Array<{ id: string; name: string }>;
}

interface ProductVariant {
	id: string;
	sku: string;
	price?: number | null;
	compareAtPrice?: number | null;
	cost?: number | null;
	stockQuantity: number;
	isActive: boolean;
	imageId?: string | null;
	images?: TImage[];
	options: Array<{
		attributeId: string;
		attributeValueId: string;
		attribute: { name_ar: string; name_en: string };
		attributeValue: { value_ar: string; value_en: string; colorHex?: string | null };
	}>;
}

// get locale from cookies or headers

// const getLocaleFromHeaders = async () => {
// 	const headerStore = await headers();
// 	let locale = headerStore.get('x-url') || headerStore.get('NEXT_LOCALE');

// 	if (!locale) {
// 		const cookies = headerStore.get('cookie');
// 		if (cookies) {
// 			const cookieStore = cookies.split('; ');
// 			const localeCookie = cookieStore.find((cookie) => cookie.startsWith('NEXT_LOCALE='));
// 			if (localeCookie) {
// 				locale = localeCookie.split('=')[1];
// 			}
// 		}
// 	}

// 	if (!locale) {
// 		locale = defaultLocale.short;
// 	}

// 	return locale;
// };

// const frontLocale = await getLocaleFromHeaders();

/////////////////////////
// HELPERS
/////////////////////////

/**
 * Format product data with translations and fallback
 */
async function formatProduct(
	product: ProductWithRelations,
	acceptLanguage?: string
): Promise<TProductFormValues | TProduct> {
	const { translations, images, seoImage, brand, category, variants, collections, tags, specifications, ...rest } = product;

	const translationData = await mapTranslations(translations, {
		accept_language: acceptLanguage,
		fields,
		enableFallback: true, // ← enable fallback
	});

	const locale = await getCurrentLocale();

	// Format brand with translation
	let brandData: { id: string; name: string; images?: TImage[] } | undefined;
	if (brand) {
		const brandTranslation = await mapTranslations(brand.translations, {
			accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
			fields: ['name'],
		});
		brandData = {
			id: brand.id,
			name: (brandTranslation as { name: string }).name || '',
			...(brand?.images?.length > 0 && {
				images: [
					{
						url: brand?.images?.[0]?.image.url,
						fileId: brand?.images?.[0]?.image.fileId,
					},
				],
			}),
		};
	}

	// Format category with translation and fallback
	let categoryData: { id: string; name: string; image?: TImage } | undefined;
	if (category) {
		const categoryTranslation = await mapTranslations(category.translations, {
			accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
			fields: ['name'],
			// enableFallback: true, // ← enable fallback
		});
		categoryData = {
			id: category.id,
			name: (categoryTranslation as { name: string }).name || '',
			...(category.images?.length > 0 && {
				images: [
					{
						url: category.images?.[0]?.image?.url,
						fileId: category.images?.[0]?.image?.fileId,
					},
				],
			}),
		};
	}

	// Format collections with translation and fallback
	const formattedCollections = await Promise.all(
		collections.map(async (c) => {
			const collectionTranslation = await mapTranslations(c.collection.translations, {
				accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
				fields: ['name'],
				enableFallback: true, // ← enable fallback
			});
			return {
				id: c.collection.id,
				name: (collectionTranslation as { name: string }).name || '',
				...(c.collection.images?.length > 0 && {
					images: [
						{
							url: c.collection.images?.[0]?.image?.url,
							fileId: c.collection.images?.[0]?.image?.fileId,
						},
					],
				}),
			};
		})
	);

	// Format tags (no translations)
	const formattedTags = tags.map((t) => ({
		id: t.tag.id,
		name: t.tag.name || '',
	}));

	// Format specifications
	const formattedSpecifications: SpecificationSection[] = specifications
		? specifications.map((spec) => ({
				id: spec.id,
				// Apply fallback: if one language is empty, use the other
				title_ar: spec.title_ar || '',
				title_en: spec.title_en || '',
				properties: spec.properties.map((prop) => ({
					id: prop.id,
					// Apply fallback for keys
					key_ar: prop.key_ar || '',
					key_en: prop.key_en || '',
					// Apply fallback for values
					value_ar: prop.value_ar || '',
					value_en: prop.value_en || '',
				})),
		  }))
		: [];

	// Format variants with translations
	const formattedVariants = await Promise.all(
		variants.map(async (variant) => {
			const formattedOptions = await Promise.all(
				variant.options.map(async (option) => {
					const attrTranslation = await mapTranslations(option.attribute.translations, {
						accept_language: acceptLanguage,
						fields: ['name'],
						enableFallback: true, // ← enable fallback
					});
					const valueTranslation = await mapTranslations(option.attributeValue.translations, {
						accept_language: acceptLanguage,
						fields: ['name'],
						enableFallback: true, // ← enable fallback
					});

					// Normalize attribute translation
					const attribute: { name_ar: string; name_en: string } = {
						name_ar: attrTranslation.name_ar ?? '',
						name_en: attrTranslation.name_en ?? '',
					};

					// Normalize attribute value translation
					const attributeValue: { value_ar: string; value_en: string; colorHex?: string } = {
						value_ar: valueTranslation.name_ar ?? '',
						value_en: valueTranslation.name_en ?? '',
						colorHex: option.attributeValue.colorHex ?? undefined,
					};

					return {
						attributeId: option.attributeId,
						attributeValueId: option.attributeValueId,
						attribute,
						attributeValue,
					};
				})
			);

			return {
				id: variant.id,
				sku: variant.sku,
				price: variant.price,
				compareAtPrice: variant.compareAtPrice,
				cost: variant.cost,
				stockQuantity: variant.stockQuantity,
				isActive: variant.isActive,
				imageId: variant.imageId,
				images: variant.images?.map((img) => ({
					url: img.image?.url ?? '',
					fileId: img.image?.fileId ?? '',
				})),
				options: formattedOptions,
			};
		})
	);

	return {
		...rest,
		seoImage: seoImage ? [{ url: seoImage.url, fileId: seoImage.fileId }] : [],
		brand: brandData,
		category: categoryData,
		collections: formattedCollections,
		tags: formattedTags,
		variants: formattedVariants,
		specifications: formattedSpecifications,
		...translationData,
		name: (translationData as { name?: string }).name || '',
		images:
			images?.length > 0
				? images.map((img) => ({
						url: img.image?.url ?? '',
						fileId: img.image?.fileId ?? '',
				  }))
				: [],
	};
}
// async function formatProduct(
// 	product: ProductWithRelations,
// 	acceptLanguage?: string
// ): Promise<TProductFormValues | TProduct> {
// 	const { translations, images, seoImage, brand, category, variants, collections, tags, specifications, ...rest } = product;

// 	const translationData = await mapTranslations(translations, {
// 		accept_language: acceptLanguage,
// 		fields,
// 	});

// 	const locale = await getCurrentLocale();

// 	// Format brand with translation
// 	let brandData: { id: string; name: string; images?: TImage[] } | undefined;
// 	if (brand) {
// 		const brandTranslation = await mapTranslations(brand.translations, {
// 			accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
// 			fields: ['name'],
// 		});
// 		brandData = {
// 			id: brand.id,
// 			name: (brandTranslation as { name: string }).name || '',
// 			...(brand?.images?.length > 0 && {
// 				images: [
// 					{
// 						url: brand?.images?.[0]?.image.url,
// 						fileId: brand?.images?.[0]?.image.fileId,
// 					},
// 				],
// 			}),
// 		};
// 	}

// 	// Format category with translation
// 	let categoryData: { id: string; name: string; image?: TImage } | undefined;
// 	if (category) {
// 		const categoryTranslation = await mapTranslations(category.translations, {
// 			accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
// 			fields: ['name'],
// 		});
// 		categoryData = {
// 			id: category.id,
// 			name: (categoryTranslation as { name: string }).name || '',
// 			...(category.images?.length > 0 && {
// 				images: [
// 					{
// 						url: category.images?.[0]?.image?.url,
// 						fileId: category.images?.[0]?.image?.fileId,
// 					},
// 				],
// 			}),
// 		};
// 	}

// 	// Format collections with translation
// 	const formattedCollections = await Promise.all(
// 		collections.map(async (c) => {
// 			const collectionTranslation = await mapTranslations(c.collection.translations, {
// 				accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
// 				fields: ['name'],
// 			});
// 			return {
// 				id: c.collection.id,
// 				name: (collectionTranslation as { name: string }).name || '',

// 				...(c.collection.images?.length > 0 && {
// 					images: [
// 						{
// 							url: c.collection.images?.[0]?.image?.url,
// 							fileId: c.collection.images?.[0]?.image?.fileId,
// 						},
// 					],
// 				}),
// 			};
// 		})
// 	);

// 	// Format tags (no translations)
// 	const formattedTags = tags.map((t) => ({
// 		id: t.tag.id,
// 		name: t.tag.name || '',
// 	}));

// 	// Format specifications (no translations needed - already bilingual)
// 	const formattedSpecifications: SpecificationSection[] = specifications
// 		? specifications.map((spec) => ({
// 				id: spec.id,
// 				title_ar: spec.title_ar,
// 				title_en: spec.title_en,
// 				properties: spec.properties.map((prop) => ({
// 					id: prop.id,
// 					key_ar: prop.key_ar,
// 					key_en: prop.key_en,
// 					value_ar: prop.value_ar,
// 					value_en: prop.value_en,
// 				})),
// 		  }))
// 		: [];

// 	// Format variants with translations
// 	const formattedVariants = await Promise.all(
// 		variants.map(async (variant) => {
// 			const formattedOptions = await Promise.all(
// 				variant.options.map(async (option) => {
// 					const attrTranslation = await mapTranslations(option.attribute.translations, {
// 						accept_language: acceptLanguage,
// 						fields: ['name'],
// 					});
// 					const valueTranslation = await mapTranslations(option.attributeValue.translations, {
// 						accept_language: acceptLanguage,
// 						fields: ['name'],
// 					});

// 					// Normalize attribute translation to always contain name_ar and name_en
// 					const attribute: { name_ar: string; name_en: string } = {
// 						name_ar: attrTranslation.name_ar ?? attrTranslation.name ?? '',
// 						name_en: attrTranslation.name_en ?? attrTranslation.name ?? '',
// 					};

// 					// Normalize attribute value translation to always contain value_ar and value_en
// 					const attributeValue: { value_ar: string; value_en: string; colorHex?: string } = {
// 						value_ar: valueTranslation.name_ar ?? valueTranslation.name ?? '',
// 						value_en: valueTranslation.name_en ?? valueTranslation.name ?? '',
// 						colorHex: option.attributeValue.colorHex ?? undefined,
// 					};

// 					return {
// 						attributeId: option.attributeId,
// 						attributeValueId: option.attributeValueId,
// 						attribute,
// 						attributeValue,
// 					};
// 				})
// 			);

// 			return {
// 				id: variant.id,
// 				sku: variant.sku,
// 				price: variant.price,
// 				compareAtPrice: variant.compareAtPrice,
// 				cost: variant.cost,
// 				stockQuantity: variant.stockQuantity,
// 				isActive: variant.isActive,
// 				imageId: variant.imageId,
// 				images: variant.images?.map((img) => ({
// 					url: img.image?.url ?? '',
// 					fileId: img.image?.fileId ?? '',
// 				})),
// 				options: formattedOptions,
// 			};
// 		})
// 	);

// 	return {
// 		...rest,
// 		seoImage: seoImage ? [{ url: seoImage.url, fileId: seoImage.fileId }] : [],
// 		brand: brandData,
// 		category: categoryData,
// 		collections: formattedCollections,
// 		tags: formattedTags,
// 		variants: formattedVariants,
// 		specifications: formattedSpecifications,
// 		...translationData,
// 		// ensure required `name` exists for TProduct
// 		name: (translationData as { name?: string }).name || '',
// 		images:
// 			images?.length > 0
// 				? images.map((img) => ({
// 						url: img.image?.url ?? '',
// 						fileId: img.image?.fileId ?? '',
// 				  }))
// 				: [],
// 	};
// }

/**
 * Build where clause for product filters
 */
function buildProductWhereClause(params: {
	search?: string;
	brandId?: string;
	categoryId?: string;
	collectionId?: string;
	isActive?: boolean;
	isFeatured?: boolean;
	inStock?: boolean;
}): Prisma.ProductWhereInput {
	const where: Prisma.ProductWhereInput = {};

	if (params.search) {
		where.OR = [
			{ sku: { contains: params.search, mode: 'insensitive' } },
			{ translations: { some: { name: { contains: params.search, mode: 'insensitive' } } } },
			{ translations: { some: { description: { contains: params.search, mode: 'insensitive' } } } },
		];
	}

	if (params.brandId) where.brandId = params.brandId;
	if (params.categoryId) where.categoryId = params.categoryId;
	if (params.isActive !== undefined) where.isActive = params.isActive;
	if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured;

	if (params.collectionId) {
		where.collections = { some: { collectionId: params.collectionId } };
	}

	if (params.inStock) {
		where.OR = [{ trackInventory: false }, { AND: [{ trackInventory: true }, { stockQuantity: { gt: 0 } }] }];
	}

	return where;
}

/**
 * Create or get attribute with values
 */
async function ensureAttributeExists(
	tx: Prisma.TransactionClient,
	titleAr: string,
	titleEn: string,
	type: AttributeType = 'COLOR'
): Promise<string> {
	// Check if attribute already exists by name
	const existing = await tx.attribute.findFirst({
		where: {
			translations: {
				some: {
					OR: [
						{ lang: 'ar', name: titleAr },
						{ lang: 'en', name: titleEn },
					],
				},
			},
			// type,
		},
		include: {
			translations: true,
		},
	});

	if (existing) {
		return existing.id;
	}

	// Create new attribute
	const newAttribute = await tx.attribute.create({
		data: {
			type,
			translations: {
				create: [
					{ lang: 'ar', name: titleAr },
					{ lang: 'en', name: titleEn },
				],
			},
		},
	});

	return newAttribute.id;
}

/**
 * Create or get attribute value
 */
async function ensureAttributeValueExists(
	tx: Prisma.TransactionClient,
	attributeId: string,
	valueAr: string,
	valueEn: string,
	colorHex?: string | null
): Promise<string> {
	// Check if value exists
	const existing = await tx.attributeValue.findFirst({
		where: {
			attributeId,
			translations: {
				some: {
					OR: [
						{ lang: 'ar', name: valueAr },
						{ lang: 'en', name: valueEn },
					],
				},
			},
		},
	});

	if (existing) {
		return existing.id;
	}

	// Create new value
	const newValue = await tx.attributeValue.create({
		data: {
			attributeId,
			value: valueEn || valueAr, // Use English or Arabic as main value
			colorHex,
			translations: {
				create: [
					{ lang: 'ar', name: valueAr },
					{ lang: 'en', name: valueEn },
				],
			},
		},
	});

	return newValue.id;
}

/**
 * Validate unique SKU
 */
async function validateUniqueSku(sku: string, excludeId?: string): Promise<ActionResult<null>> {
	const where: Prisma.ProductWhereInput = {
		sku,
		...(excludeId ? { id: { not: excludeId } } : {}),
	};

	const duplicate = await prisma_DB.product.findFirst({ where, select: { id: true } });

	if (duplicate) {
		return {
			success: false,
			status: 400,
			form_errors: JSON.stringify({ sku: ['api.errors.sku_exists'] }),
			error: 'api.errors.inputs_validation',
		};
	}

	return { success: true, status: 200, data: null };
}

/**
 * Validate unique slugs
 */
async function validateUniqueSlugs(id?: string, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
	const or: Prisma.ProductTranslationWhereInput[] = [];
	if (slug_ar) or.push({ lang: 'ar', slug: slug_ar });
	if (slug_en) or.push({ lang: 'en', slug: slug_en });
	if (!or.length) return { success: true, status: 200, data: null };

	const where: Prisma.ProductTranslationWhereInput = {
		OR: or,
		...(id ? { productId: { not: id } } : {}),
	};

	const duplicate = await prisma_DB.productTranslation.findFirst({ where });

	if (duplicate) {
		return {
			success: false,
			status: 400,
			form_errors: JSON.stringify({ [`slug_${duplicate.lang}`]: ['api.errors.slug_exists'] }),
			error: 'api.errors.inputs_validation',
		};
	}

	return { success: true, status: 200, data: null };
}

/////////////////////////
// MAIN SERVICES
/////////////////////////

/**
 * 🔹 Get All Products with Pagination and Filters
 */
export async function getAllProducts(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		brandId?: string;
		categoryId?: string;
		collectionId?: string;
		isActive?: boolean;
		isFeatured?: boolean;
		inStock?: boolean;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
): Promise<ActionResult<TProduct>> {
	const page = Number(params?.page) || 1;
	const limit = Number(params?.limit) || 10;
	const skip = (page - 1) * limit;

	const sortableFields = ['name', 'slug', 'basePrice', 'stockQuantity', 'createdAt', 'sortOrder'];
	const sortBy = sortableFields.includes(params?.sortBy || '') ? params?.sortBy : undefined;
	const sortOrder = params?.sortOrder === 'desc' ? 'desc' : 'asc';
	const localeKey = (locale?.split('-')[0] as 'ar' | 'en') || 'en';

	const orderBy = sortBy ? { [`${sortBy}_${localeKey}`]: sortOrder } : { sortOrder: 'asc' as const };

	const where = buildProductWhereClause({
		search: params?.search?.trim() || '',
		brandId: params?.brandId,
		categoryId: params?.categoryId,
		collectionId: params?.collectionId,
		isActive: params?.isActive,
		isFeatured: params?.isFeatured,
		inStock: params?.inStock,
	});

	const [products, total] = await Promise.all([
		prisma_DB.product.findMany({
			where,
			skip,
			take: limit,
			include: {
				translations: true,
				brand: { include: { translations: true, images: { include: { image: true } } } },
				category: { include: { translations: true, images: { include: { image: true } } } },
				image: true,
				seoImage: true,
				images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
				variants: {
					include: {
						image: true,
						images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
						options: {
							include: {
								attribute: { include: { translations: true } },
								attributeValue: { include: { translations: true } },
							},
						},
					},
					orderBy: { sortOrder: 'asc' },
				},
				attributes: {
					include: {
						attribute: { include: { translations: true } },
						attributeValue: { include: { translations: true } },
					},
				},
				tags: { include: { tag: true } },
				collections: {
					include: { collection: { include: { translations: true, images: { include: { image: true } } } } },
				},
				specifications: { include: { properties: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
				discounts: {
					where: {
						isActive: true,
						startDate: { lte: new Date() },
						OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
					},
					orderBy: { priority: 'desc' },
				},
			},
			orderBy,
		}),
		prisma_DB.product.count({ where }),
	]);

	const data = await Promise.all(products.map((item) => formatProduct(item, locale)));

	return {
		success: true,
		status: 200,
		data: data as TProduct[],
		meta: {
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
			sort: sortBy ? { by: sortBy, order: sortOrder } : undefined,
		},
	};
}

/**
 * 🔹 Get Single Product by ID, SKU, or Slug (Unified Search)
 */
export async function getProduct(
	identifier: string,
	locale?: TLocalesData
): Promise<ActionResult<TProduct | TProductFormValues>> {
	if (!identifier) throw new AppError('api.errors.invalid_identifier', 404);

	let product: ProductWithRelations | null = null;

	// Find product by ID, SKU, or Slug (check both languages)
	if (!product) {
		product = await prisma_DB.product.findFirst({
			where: {
				OR: [
					{ id: identifier },
					{ sku: identifier },
					{
						translations: {
							some: {
								slug: identifier,
							},
						},
					},
				],
			},
			include: {
				translations: true,
				brand: { include: { translations: true, images: { include: { image: true } } } },
				category: { include: { translations: true, images: { include: { image: true } } } },
				// image: true,
				seoImage: true,
				images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
				variants: {
					include: {
						image: true,
						images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
						options: {
							include: {
								attribute: { include: { translations: true } },
								attributeValue: { include: { translations: true } },
							},
						},
					},
					orderBy: { sortOrder: 'asc' },
				},
				attributes: {
					include: {
						attribute: { include: { translations: true } },
						attributeValue: { include: { translations: true } },
					},
				},
				tags: { include: { tag: true } },
				collections: {
					include: { collection: { include: { translations: true, images: { include: { image: true } } } } },
				},
				specifications: { include: { properties: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
				discounts: {
					where: {
						isActive: true,
						startDate: { lte: new Date() },
						OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
					},
					orderBy: { priority: 'desc' },
				},
			},
		});
	}

	if (!product) throw new AppError('api.errors.not_found', 404);

	const data = await formatProduct(product, locale);

	return {
		success: true,
		status: 200,
		data: data as TProduct | TProductFormValues,
	};
}

/**
 * 🟢 Create Product
 */
export async function createProduct(data: TProductFormValues): Promise<ActionResult<TProductFormValues>> {
	const validation = await ValidateFormAction(formSchemaProduct, data);
	if (!validation.success) {
		return {
			...validation,
			form_errors: JSON.stringify(validation.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	// Validate unique SKU
	const skuCheck = await validateUniqueSku(data.sku);
	if (!skuCheck.success) return skuCheck as unknown as ActionResult<TProductFormValues>;

	// Validate unique slugs
	const slugCheck = await validateUniqueSlugs(undefined, data.slug_ar, data.slug_en);
	if (!slugCheck.success) return slugCheck as unknown as ActionResult<TProductFormValues>;

	// Find or create SEO image
	const existingSeoImage = data.seoImage?.length
		? await prisma_DB.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
		: null;

	// Find or create main image
	const existingMainImage = data.images?.length
		? await prisma_DB.image.findFirst({ where: { fileId: data.images[0].fileId } })
		: null;

	const product = await prisma_DB.$transaction(async (tx) => {
		// Ensure SEO image exists in the transaction (create if missing) and get its id
		let seoImageId: string | null = existingSeoImage?.id || null;
		if (data.seoImage?.length && !existingSeoImage) {
			const createdSeoImage = await tx.image.create({
				data: { fileId: data.seoImage[0].fileId, url: data.seoImage[0].url },
			});
			seoImageId = createdSeoImage.id;
		}

		const created = await tx.product.create({
			data: {
				sku: data.sku,
				brandId: data.brand || null,
				categoryId: data.category || null,
				type: data.type || null,
				basePrice: data.basePrice,
				compareAtPrice: data.compareAtPrice || null,
				cost: data.cost || null,
				trackInventory: data.trackInventory,
				stockQuantity: data.stockQuantity || 0,
				lowStockAlert: data.lowStockAlert || null,
				isActive: data.isActive,
				isFeatured: data.isFeatured ?? false,
				sortOrder: data.sortOrder || 0,
				weight: data.weight || null,
				length: data.length || null,
				width: data.width || null,
				height: data.height || null,

				// Main image
				imageId: existingMainImage?.id || null,

				// SEO Image (set by id to match Prisma types)
				seoImageId: seoImageId || undefined,

				// Product images
				images: data.images?.length
					? {
							create: await Promise.all(
								data.images.map(async (img, idx) => {
									const existingImage = await tx.image.findFirst({ where: { fileId: img.fileId } });
									return {
										sortOrder: idx,
										isPrimary: idx === 0,
										image: existingImage
											? { connect: { id: existingImage.id } }
											: { create: { fileId: img.fileId, url: img.url } },
									};
								})
							),
					  }
					: undefined,

				// Translations
				translations: {
					create: [
						{
							lang: 'ar',
							name: data.name_ar,
							slug: data.slug_ar,
							description: data.description_ar || '',
							shortDescription: data.shortDescription_ar || '',
							seoTitle: data.seoTitle_ar || '',
							seoDescription: data.seoDescription_ar || '',
							seoKeywords: data.seoKeywords_ar || '',
						},
						{
							lang: 'en',
							name: data.name_en,
							slug: data.slug_en,
							description: data.description_en || '',
							shortDescription: data.shortDescription_en || '',
							seoTitle: data.seoTitle_en || '',
							seoDescription: data.seoDescription_en || '',
							seoKeywords: data.seoKeywords_en || '',
						},
					],
				},

				// Collections
				collections: data.collections?.length
					? { create: data.collections.map((collectionId) => ({ collectionId })) }
					: undefined,

				// Tags
				tags: data.tags?.length ? { create: data.tags.map((tagId) => ({ tagId })) } : undefined,

				// Specifications
				specifications: data.specifications?.length
					? {
							create: data.specifications.map((spec, specIndex) => ({
								title_ar: spec.title_ar,
								title_en: spec.title_en,
								sortOrder: specIndex,
								properties: {
									create: spec.properties.map((prop, propIndex) => ({
										key_ar: prop.key_ar,
										key_en: prop.key_en,
										value_ar: prop.value_ar,
										value_en: prop.value_en,
										sortOrder: propIndex,
									})),
								},
							})),
					  }
					: undefined,
			},
			include: {
				translations: true,
				brand: { include: { translations: true, image: true } },
				category: { include: { translations: true, image: true } },
				image: true,
				seoImage: true,
				images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
				variants: {
					include: {
						image: true,
						images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
						options: {
							include: {
								attribute: { include: { translations: true } },
								attributeValue: { include: { translations: true } },
							},
						},
					},
					orderBy: { sortOrder: 'asc' },
				},
				attributes: {
					include: {
						attribute: { include: { translations: true } },
						attributeValue: { include: { translations: true } },
					},
				},
				tags: { include: { tag: true } },
				collections: { include: { collection: { include: { translations: true, image: true } } } },
				specifications: { include: { properties: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
				discounts: true,
			},
		});

		// Create variants if provided
		if (data.combinations && data.combinations.length > 0) {
			for (const combination of data.combinations) {
				if (!combination.checked) continue;

				// ✅ تأكد من إنشاء/جلب الـ Attributes و Values
				const processedAttributes: Array<{
					attributeId: string;
					attributeValueId: string;
				}> = [];

				for (const attr of combination.attributes) {
					// Ensure attribute exists (create if needed)
					const attributeId = await ensureAttributeExists(
						tx,
						attr.name_ar,
						attr.name_en
						// 'VARIANT' // or get from your enum
					);

					// Ensure attribute value exists (create if needed)
					const attributeValueId = await ensureAttributeValueExists(
						tx,
						attributeId,
						attr.value_ar,
						attr.value_en,
						attr.colorHex
					);

					// Avoid duplicates in same variant
					if (!processedAttributes.find((a) => a.attributeId === attributeId)) {
						processedAttributes.push({
							attributeId,
							attributeValueId,
						});
					}
				}

				const variantImages = combination.images || [];
				const existingVariantImage = combination.imageId
					? await tx.image.findUnique({ where: { id: combination.imageId } })
					: null;

				await tx.productVariant.create({
					data: {
						productId: created.id,
						sku: combination.sku || `${data.sku}-${combination.id}`,
						price: typeof combination.price === 'string' ? parseFloat(combination.price) : combination.price,
						compareAtPrice:
							combination.compareAtPrice && typeof combination.compareAtPrice === 'string'
								? parseFloat(combination.compareAtPrice)
								: (combination.compareAtPrice as number) || null,
						cost:
							combination.cost && typeof combination.cost === 'string'
								? parseFloat(combination.cost)
								: (combination.cost as number) || null,
						stockQuantity: combination.qty || 0,
						isActive: true,
						imageId: existingVariantImage?.id || null,

						// Variant images
						images: variantImages.length
							? {
									create: await Promise.all(
										variantImages.map(async (img, idx) => {
											const existingImage = await tx.image.findFirst({ where: { fileId: img.fileId } });
											return {
												sortOrder: idx,
												isPrimary: idx === 0,
												image: existingImage
													? { connect: { id: existingImage.id } }
													: { create: { fileId: img.fileId, url: img.url } },
											};
										})
									),
							  }
							: undefined,

						// ✅ استخدم processedAttributes (IDs حقيقية من DB)
						options: {
							create: processedAttributes,
						},
					},
				});
			}
		}

		return created;
	});

	revalidatePath('/dashboard/products');
	const formattedData = await formatProduct(product as ProductWithRelations);
	logger.info(`✅ Product created: ${product.id}`, { context: 'ProductService' });

	return {
		success: true,
		status: 201,
		data: formattedData as TProductFormValues,
		message: 'api.products.success.create',
	};
}

/**
 * 🟡 Update Product
 */
export async function updateProduct(id: string, data: TProductFormValues): Promise<ActionResult<TProductFormValues>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const validation = await ValidateFormAction(formSchemaProduct, data);
	if (!validation.success) {
		return {
			...validation,
			form_errors: JSON.stringify(validation.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	// Validate unique SKU
	const skuCheck = await validateUniqueSku(data.sku, id);
	if (!skuCheck.success) return skuCheck as unknown as ActionResult<TProductFormValues>;
	await prisma_DB.$transaction(async (tx) => {
		const existingSeoImage = data.seoImage?.length
			? await tx.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
			: null;

		const existingMainImage = data.images?.length
			? await tx.image.findFirst({ where: { fileId: data.images[0].fileId } })
			: null;

		// If SEO image provided and not existing, create it in transaction and get its id
		let seoImageId: string | null = existingSeoImage?.id || null;
		if (data.seoImage?.length && !existingSeoImage) {
			const createdSeoImage = await tx.image.create({
				data: { fileId: data.seoImage[0].fileId, url: data.seoImage[0].url },
			});
			seoImageId = createdSeoImage.id;
		}

		await tx.product.update({
			where: { id },
			data: {
				sku: data.sku,
				brandId: data.brand || null,
				categoryId: data.category || null,
				type: data.type || null,
				basePrice: data.basePrice,
				compareAtPrice: data.compareAtPrice || null,
				cost: data.cost || null,
				trackInventory: data.trackInventory,
				stockQuantity: data.stockQuantity || 0,
				lowStockAlert: data.lowStockAlert || null,
				isActive: data.isActive,
				isFeatured: data.isFeatured ?? false,
				sortOrder: data.sortOrder || 0,
				weight: data.weight || null,
				length: data.length || null,
				width: data.width || null,
				height: data.height || null,
				imageId: existingMainImage?.id || null,

				// SEO Image (set by id to match Prisma types)
				seoImageId: seoImageId || undefined,

				// Product images - delete and recreate
				images: data.images?.length
					? {
							deleteMany: {},
							create: await Promise.all(
								data.images.map(async (img, idx) => {
									const existingImage = await tx.image.findFirst({ where: { fileId: img.fileId } });
									return {
										sortOrder: idx,
										isPrimary: idx === 0,
										image: existingImage
											? { connect: { id: existingImage.id } }
											: { create: { fileId: img.fileId, url: img.url } },
									};
								})
							),
					  }
					: undefined,
			},
		});

		// Update translations
		const langs = Object.keys(localesData) as TLocalesData[];
		for (const lang of langs) {
			const name = data[`name_${lang}`];
			const slug = data[`slug_${lang}`];
			const description = data[`description_${lang}`];
			const shortDescription = data[`shortDescription_${lang}`];
			const seoTitle = data[`seoTitle_${lang}`];
			const seoDescription = data[`seoDescription_${lang}`];
			const seoKeywords = data[`seoKeywords_${lang}`];

			const existing = await tx.productTranslation.findFirst({ where: { productId: id, lang } });
			if (existing) {
				await tx.productTranslation.update({
					where: { id: existing.id },
					data: { name, slug, description, shortDescription, seoTitle, seoDescription, seoKeywords },
				});
			} else {
				await tx.productTranslation.create({
					data: {
						productId: id,
						lang,
						name,
						slug,
						description,
						shortDescription,
						seoTitle,
						seoDescription,
						seoKeywords,
					},
				});
			}
		}

		// Update collections
		if (data.collections !== undefined) {
			await tx.collectionProduct.deleteMany({ where: { productId: id } });
			if (data.collections.length > 0) {
				await tx.collectionProduct.createMany({
					data: data.collections.map((collectionId) => ({ productId: id, collectionId })),
				});
			}
		}

		// Update tags
		if (data.tags !== undefined) {
			await tx.productTag.deleteMany({ where: { productId: id } });
			if (data.tags.length > 0) {
				await tx.productTag.createMany({
					data: data.tags.map((tagId) => ({ productId: id, tagId })),
				});
			}
		}

		// Update specifications if provided
		if (data.specifications !== undefined) {
			// Get existing specifications
			const existingSpecs = await tx.productSpecification.findMany({
				where: { productId: id },
				include: { properties: true },
			});

			const existingSpecIds = new Set(existingSpecs.map((s) => s.id));
			const incomingSpecIds = new Set(data.specifications.filter((s) => s.id).map((s) => s.id!));

			// Delete specifications that are no longer present
			const specsToDelete = existingSpecs.filter((s) => !incomingSpecIds.has(s.id));
			if (specsToDelete.length > 0) {
				await tx.productSpecification.deleteMany({
					where: {
						id: { in: specsToDelete.map((s) => s.id) },
					},
				});
			}

			// Update or create specifications
			for (let i = 0; i < data.specifications.length; i++) {
				const spec = data.specifications[i];

				if (spec.id && existingSpecIds.has(spec.id)) {
					// Update existing specification
					const existingSpec = existingSpecs.find((s) => s.id === spec.id)!;
					const existingPropIds = new Set(existingSpec.properties.map((p) => p.id));
					const incomingPropIds = new Set(spec.properties.filter((p) => p.id).map((p) => p.id!));

					// Delete properties that are no longer present
					const propsToDelete = existingSpec.properties.filter((p) => !incomingPropIds.has(p.id));
					if (propsToDelete.length > 0) {
						await tx.productSpecificationProperty.deleteMany({
							where: {
								id: { in: propsToDelete.map((p) => p.id) },
							},
						});
					}

					// Update or create properties
					for (let j = 0; j < spec.properties.length; j++) {
						const prop = spec.properties[j];

						if (prop.id && existingPropIds.has(prop.id)) {
							// Update existing property
							await tx.productSpecificationProperty.update({
								where: { id: prop.id },
								data: {
									key_ar: prop.key_ar,
									key_en: prop.key_en,
									value_ar: prop.value_ar,
									value_en: prop.value_en,
									sortOrder: j,
								},
							});
						} else {
							// Create new property
							await tx.productSpecificationProperty.create({
								data: {
									specificationId: spec.id,
									key_ar: prop.key_ar,
									key_en: prop.key_en,
									value_ar: prop.value_ar,
									value_en: prop.value_en,
									sortOrder: j,
								},
							});
						}
					}

					// Update specification title and sortOrder
					await tx.productSpecification.update({
						where: { id: spec.id },
						data: {
							title_ar: spec.title_ar,
							title_en: spec.title_en,
							sortOrder: i,
						},
					});
				} else {
					// Create new specification
					await tx.productSpecification.create({
						data: {
							productId: id,
							title_ar: spec.title_ar,
							title_en: spec.title_en,
							sortOrder: i,
							properties: {
								create: spec.properties.map((prop, propIndex) => ({
									key_ar: prop.key_ar,
									key_en: prop.key_en,
									value_ar: prop.value_ar,
									value_en: prop.value_en,
									sortOrder: propIndex,
								})),
							},
						},
					});
				}
			}
		}

		// Update variants - delete old and create new
		if (data.combinations !== undefined) {
			await tx.productVariant.deleteMany({ where: { productId: id } });

			for (const combination of data.combinations) {
				if (!combination.checked) continue;

				// ✅ sure to create/get Attributes and Values
				// Use processedAttributes to avoid duplicates
				const processedAttributes: Array<{
					attributeId: string;
					attributeValueId: string;
				}> = [];

				for (const attr of combination.attributes) {
					const attributeId = await ensureAttributeExists(tx, attr.name_ar, attr.name_en);

					const attributeValueId = await ensureAttributeValueExists(
						tx,
						attributeId,
						attr.value_ar,
						attr.value_en,
						attr.colorHex
					);

					if (!processedAttributes.find((a) => a.attributeId === attributeId)) {
						processedAttributes.push({
							attributeId,
							attributeValueId,
						});
					}
				}

				const variantImages = combination.images || [];
				const existingVariantImage = combination.imageId
					? await tx.image.findUnique({ where: { id: combination.imageId } })
					: null;

				await tx.productVariant.create({
					data: {
						productId: id,
						sku: combination.sku || `${data.sku}-${combination.id}`,
						price: typeof combination.price === 'string' ? parseFloat(combination.price) : combination.price,
						compareAtPrice:
							combination.compareAtPrice && typeof combination.compareAtPrice === 'string'
								? parseFloat(combination.compareAtPrice)
								: (combination.compareAtPrice as number) || null,
						cost:
							combination.cost && typeof combination.cost === 'string'
								? parseFloat(combination.cost)
								: (combination.cost as number) || null,
						stockQuantity: combination.qty || 0,
						isActive: true,
						imageId: existingVariantImage?.id || null,

						images: variantImages.length
							? {
									create: await Promise.all(
										variantImages.map(async (img, idx) => {
											const existingImage = await tx.image.findFirst({ where: { fileId: img.fileId } });
											return {
												sortOrder: idx,
												isPrimary: idx === 0,
												image: existingImage
													? { connect: { id: existingImage.id } }
													: { create: { fileId: img.fileId, url: img.url } },
											};
										})
									),
							  }
							: undefined,

						// ✅ use processedAttributes
						options: {
							create: processedAttributes,
						},
					},
				});
			}
		}
	});

	const product = await prisma_DB.product.findUnique({
		where: { id },
		include: {
			translations: true,
			brand: { include: { translations: true, image: true } },
			category: { include: { translations: true, image: true } },
			image: true,
			seoImage: true,
			images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
			variants: {
				include: {
					image: true,
					images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
					options: {
						include: {
							attribute: { include: { translations: true } },
							attributeValue: { include: { translations: true } },
						},
					},
				},
				orderBy: { sortOrder: 'asc' },
			},
			attributes: {
				include: {
					attribute: { include: { translations: true } },
					attributeValue: { include: { translations: true } },
				},
			},
			tags: { include: { tag: true } },
			collections: { include: { collection: { include: { translations: true, image: true } } } },
			specifications: { include: { properties: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
			discounts: true,
		},
	});

	if (!product) throw new AppError('api.errors.not_found', 404);

	revalidateTag('products', 'max');
	const formattedData = await formatProduct(product as ProductWithRelations);
	logger.info(`✅ Product updated: ${product.id}`, { context: 'ProductService' });

	return {
		success: true,
		status: 200,
		data: formattedData as TProductFormValues,
		message: 'api.products.success.update',
	};
}

/**
 * 🟢 Toggle Active Status
 */
export async function toggleStateProduct(
	id: string,
	isActive: boolean
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
	const updated = await prisma_DB.product.update({
		where: { id },
		data: { isActive },
		select: { id: true, isActive: true },
	});

	revalidateTag('products', 'max');

	return {
		success: true,
		status: 200,
		data: updated,
		message: 'api.success.update_status',
	};
}

/**
 * 🟢 Toggle Featured Status
 */
export async function toggleFeaturedProduct(
	id: string,
	isFeatured: boolean
): Promise<ActionResult<{ id: string; isFeatured: boolean }>> {
	const updated = await prisma_DB.product.update({
		where: { id },
		data: { isFeatured },
		select: { id: true, isFeatured: true },
	});

	revalidateTag('products', 'max');

	return {
		success: true,
		status: 200,
		data: updated,
		message: 'api.success.update_status',
	};
}

/**
 * 🔴 Delete Product
 */
export async function deleteProduct(id: string): Promise<ActionResult<null>> {
	await prisma_DB.product.delete({ where: { id } });

	revalidateTag('products', 'max');
	logger.info(`✅ Product deleted: ${id}`, { context: 'ProductService' });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.products.success.delete',
	};
}

/**
 * 🔴 Delete Many Products
 */
export async function deleteManyProducts(ids: string[]): Promise<ActionResult<null>> {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	const deleted = await prisma_DB.product.deleteMany({
		where: { id: { in: ids } },
	});

	if (!deleted.count) throw new AppError('api.products.errors.delete', 404);

	revalidateTag('products', 'max');
	logger.info(`✅ ${deleted.count} products deleted`, { context: 'ProductService' });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.products.success.delete_many',
	};
}

/**
 * 🟢 Update Product Stock
 */
export async function updateProductStock(
	id: string,
	quantity: number,
	operation: 'add' | 'subtract' | 'set' = 'set'
): Promise<ActionResult<{ id: string; stockQuantity: number }>> {
	const product = await prisma_DB.product.findUnique({
		where: { id },
		select: { stockQuantity: true },
	});

	if (!product) throw new AppError('api.errors.not_found', 404);

	let newQuantity: number;

	switch (operation) {
		case 'add':
			newQuantity = product.stockQuantity + quantity;
			break;
		case 'subtract':
			newQuantity = Math.max(0, product.stockQuantity - quantity);
			break;
		case 'set':
		default:
			newQuantity = quantity;
	}

	const updated = await prisma_DB.product.update({
		where: { id },
		data: { stockQuantity: newQuantity },
		select: { id: true, stockQuantity: true },
	});

	revalidateTag('products', 'max');

	return {
		success: true,
		status: 200,
		data: updated,
		message: 'api.products.success.update_stock',
	};
}

/**
 * 🟢 Bulk Update Product Status
 */
export async function bulkUpdateProductStatus(ids: string[], isActive: boolean): Promise<ActionResult<{ count: number }>> {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	const result = await prisma_DB.product.updateMany({
		where: { id: { in: ids } },
		data: { isActive },
	});

	revalidateTag('products', 'max');
	logger.info(`✅ ${result.count} products status updated`, { context: 'ProductService' });

	return {
		success: true,
		status: 200,
		data: { count: result.count },
		message: 'api.products.success.update_bulk',
	};
}

/**
 * 🔹 Get Featured Products
 */
export async function getFeaturedProducts(limit = 10, locale?: TLocalesData): Promise<ActionResult<TProduct>> {
	const products = await prisma_DB.product.findMany({
		where: {
			isFeatured: true,
			isActive: true,
		},
		take: limit,
		include: {
			translations: true,
			brand: { include: { translations: true, images: { include: { image: true } } } },
			category: { include: { translations: true, images: { include: { image: true } } } },
			image: true,
			seoImage: true,
			images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
			variants: {
				include: {
					image: true,
					images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
					options: {
						include: {
							attribute: { include: { translations: true } },
							attributeValue: { include: { translations: true } },
						},
					},
				},
				orderBy: { sortOrder: 'asc' },
			},
			attributes: {
				include: {
					attribute: { include: { translations: true } },
					attributeValue: { include: { translations: true } },
				},
			},
			tags: { include: { tag: true } },
			collections: { include: { collection: { include: { translations: true, images: { include: { image: true } } } } } },
			specifications: { include: { properties: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
			discounts: {
				where: {
					isActive: true,
					startDate: { lte: new Date() },
					OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
				},
				orderBy: { priority: 'desc' },
			},
		},
		orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
	});

	const data = await Promise.all(products.map((p) => formatProduct(p, locale)));

	return {
		success: true,
		status: 200,
		data: data as TProduct[],
	};
}

/**
 * 🔹 Get Related Products
 */
export async function getRelatedProducts(
	productId: string,
	limit = 6,
	locale?: TLocalesData
): Promise<ActionResult<TProduct>> {
	const product = await prisma_DB.product.findUnique({
		where: { id: productId },
		select: { categoryId: true, brandId: true },
	});

	if (!product) throw new AppError('api.errors.not_found', 404);

	const products = await prisma_DB.product.findMany({
		where: {
			id: { not: productId },
			isActive: true,
			OR: [{ categoryId: product.categoryId }, { brandId: product.brandId }],
		},
		take: limit,
		include: {
			translations: true,
			brand: { include: { translations: true, images: { include: { image: true } } } },
			category: { include: { translations: true, images: { include: { image: true } } } },
			image: true,
			seoImage: true,
			images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
			variants: {
				include: {
					image: true,
					images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
					options: {
						include: {
							attribute: { include: { translations: true } },
							attributeValue: { include: { translations: true } },
						},
					},
				},
				orderBy: { sortOrder: 'asc' },
			},
			attributes: {
				include: {
					attribute: { include: { translations: true } },
					attributeValue: { include: { translations: true } },
				},
			},
			tags: { include: { tag: true } },
			collections: { include: { collection: { include: { translations: true, images: { include: { image: true } } } } } },
			specifications: { include: { properties: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
			discounts: {
				where: {
					isActive: true,
					startDate: { lte: new Date() },
					OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
				},
				orderBy: { priority: 'desc' },
			},
		},
	});

	const data = await Promise.all(products.map((p) => formatProduct(p, locale)));

	return {
		success: true,
		status: 200,
		data: data as TProduct[],
	};
}

/**
 * 🔹 Get Product Stock Status
 */
export async function getProductStockStatus(id: string): Promise<
	ActionResult<{
		quantity: number;
		isTracked: boolean;
		isInStock: boolean;
		isLowStock: boolean;
	}>
> {
	const product = await prisma_DB.product.findUnique({
		where: { id },
		select: {
			stockQuantity: true,
			lowStockAlert: true,
			trackInventory: true,
		},
	});

	if (!product) throw new AppError('api.errors.not_found', 404);

	const status = {
		quantity: product.stockQuantity,
		isTracked: product.trackInventory,
		isInStock: !product.trackInventory || product.stockQuantity > 0,
		isLowStock: product.trackInventory && product.lowStockAlert !== null && product.stockQuantity <= product.lowStockAlert,
	};

	return {
		success: true,
		status: 200,
		data: status,
	};
}

/**
 * 🔹 Check SKU Availability
 */
export async function checkSkuAvailability(sku: string, excludeId?: string): Promise<ActionResult<{ available: boolean }>> {
	const product = await prisma_DB.product.findFirst({
		where: {
			sku,
			...(excludeId && { id: { not: excludeId } }),
		},
		select: { id: true },
	});

	return {
		success: true,
		status: 200,
		data: { available: !product },
	};
}

/**
 * 🔹 Check Slug Availability
 */
export async function checkSlugAvailability(
	slug: string,
	lang: 'ar' | 'en',
	excludeProductId?: string
): Promise<ActionResult<{ available: boolean }>> {
	const translation = await prisma_DB.productTranslation.findFirst({
		where: {
			slug,
			lang,
			...(excludeProductId && { productId: { not: excludeProductId } }),
		},
		select: { id: true },
	});

	return {
		success: true,
		status: 200,
		data: { available: !translation },
	};
}

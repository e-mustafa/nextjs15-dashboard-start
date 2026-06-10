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
import { AttributeType, DiscountType, Prisma, ProductType } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { calculateDiscountedPrice } from './utils';


const cacheTag = 'products';
const cacheProfile = 'max'

/////////////////////////
// TYPES
/////////////////////////

const PRODUCT_COMPLETE_INCLUDE = {
	translations: true,
	brand: { include: { translations: true, images: { include: { image: true } } } },
	category: { include: { translations: true, images: { include: { image: true } } } },
	seoImage: true,
	images: { include: { image: true }, orderBy: { sortOrder: 'asc' as const } },
	variants: {
		include: {
			image: true,
			images: { include: { image: true }, orderBy: { sortOrder: 'asc' as const } },
			options: {
				include: {
					attribute: { include: { translations: true } },
					attributeValue: { include: { translations: true } },
				},
			},
		},
		orderBy: { sortOrder: 'asc' as const },
	},
	attributes: {
		include: {
			attribute: { include: { translations: true } },
			attributeValue: { include: { translations: true } },
		},
	},
	tags: { include: { tag: true } },
	collections: { include: { collection: { include: { translations: true, images: { include: { image: true } } } } } },
	specifications: {
		include: { properties: { orderBy: { sortOrder: 'asc' as const } } },
		orderBy: { sortOrder: 'asc' as const },
	},
	discounts: {
		where: {
			discount: {
				isActive: true,
				startDate: { lte: new Date() },
				OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
			},
		},
		include: { discount: true },
		orderBy: { discount: { priority: 'desc' as const } },
		take: 1,
	},
};
type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_COMPLETE_INCLUDE }>;

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

export interface TDiscount {
	id: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	type: DiscountType;
	// name_ar: string;
	// name_en: string;
	value: number;
	startDate: Date;
	endDate: Date | null;
	priority: number;
	minDiscountValue: number | null;
	maxDiscountValue: number | null;
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
	// keepSelling: boolean;
	isActive: boolean;
	isFeatured: boolean;
	sortOrder: number;
	type: ProductType;
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
	// brand?: { id: string; name: string; image?: TImage };
	// category?: { id: string; name: string; image?: TImage };
	// collections?: Array<{ id: string; name: string; image?: TImage }>;
	brand?: string;
	category?: string;
	collections?: string[];
	variants?: ProductVariant[];
	specifications?: SpecificationSection[];

	// for preload item in
	initialItems: {
		brands?: { id: string; name: string; image?: string };
		categories?: { id: string; name: string; image?: string };
		collections?: Array<{ id: string; name: string; image?: string }>;
		tags: Array<{ id: string; name: string }>;
	};

	discounts?: TDiscount[];

	finalPrice?: number;
	discountAmount?: number;
	discountPercentage?: number;
	hasDiscount?: boolean;
	activeDiscount?: {
		id: string;
		type: DiscountType;
		value: number;
		// name_ar: string;
		// name_en: string;
		startDate: string;
		endDate: string | null;
	} | null;
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

/////////////////////////
// HELPERS
/////////////////////////

/**
 * Format product data with translations and fallback
 */
async function formatProduct(
	product: ProductWithRelations,
	acceptLanguage?: string,
	forEdit: boolean = false, // acceptLanguage === '*',
): Promise<TProductFormValues | TProduct> {
	const {
		translations,
		images,
		seoImage,
		brand,
		category,
		variants,
		collections,
		tags,
		specifications,
		discounts,
		...rest
	} = product;

	const translationData = await mapTranslations(translations, {
		accept_language: forEdit ? '*' : acceptLanguage,
		fields: fields,
		enableFallback: !forEdit,
	});

	const locale = await getCurrentLocale();

	// Format brand with translation
	let brandData: { id: string; name: string; image?: string } | undefined;
	if (brand) {
		const brandTranslation = await mapTranslations(brand.translations, {
			accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
			fields: ['name'],
		});
		// brandData = {
		// 	id: brand.id,
		// 	name: (brandTranslation as { name: string }).name || '',
		// 	...(brand?.images?.length && {
		// 		images: [
		// 			{
		// 				url: brand.images[0].image.url,
		// 				fileId: brand.images[0].image.fileId,
		// 			},
		// 		],
		// 	}),
		// };

		brandData = {
			id: brand.id,
			name: (brandTranslation as { name: string }).name || '',
			...(brand?.images?.length && {
				image: brand.images[0].image.url,
			}),
		};
	}

	// Format category with translation
	let categoryData: { id: string; name: string; image?: string } | undefined;
	if (category) {
		const categoryTranslation = await mapTranslations(category.translations, {
			accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
			fields: ['name'],
		});
		categoryData = {
			id: category.id,
			name: (categoryTranslation as { name: string }).name || '',
			// ...(category.images?.length && {
			// 	images: [
			// 		{
			// 			url: category.images[0].image?.url || '',
			// 			fileId: category.images[0].image?.fileId || '',
			// 		},
			// 	],
			// }),

			...(category.images?.length && {
				image: category.images[0].image?.url || '',
			}),
		};
	}

	// Format collections with translation
	const formattedCollections = await Promise.all(
		collections.map(async (c) => {
			const collectionTranslation = await mapTranslations(c.collection.translations, {
				accept_language: acceptLanguage !== '*' ? acceptLanguage : locale,
				fields: ['name'],
				enableFallback: true,
			});
			return {
				id: c.collection.id,
				name: (collectionTranslation as { name: string }).name || '',
				// ...(c.collection.images?.length && {
				// 	images: [
				// 		{
				// 			url: c.collection.images[0].image?.url || '',
				// 			fileId: c.collection.images[0].image?.fileId || '',
				// 		},
				// 	],
				// }),
				...(c.collection.images?.length && {
					image: c.collection.images[0].image?.url || '',
				}),
			};
		}),
	);

	// Format tags
	const formattedTags = tags.map((t) => ({
		id: t.tag.id,
		name: t.tag.name || '',
	}));

	// Format specifications
	const formattedSpecifications: SpecificationSection[] = specifications
		? specifications.map((spec) => ({
				id: spec.id,
				title_ar: spec.title_ar || '',
				title_en: spec.title_en || '',
				properties: spec.properties.map((prop) => ({
					id: prop.id,
					key_ar: prop.key_ar || '',
					key_en: prop.key_en || '',
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
						enableFallback: true,
					});
					const valueTranslation = await mapTranslations(option.attributeValue.translations, {
						accept_language: acceptLanguage,
						fields: ['name'],
						enableFallback: true,
					});

					const attribute: { name_ar: string; name_en: string } = {
						name_ar: attrTranslation.name_ar ?? '',
						name_en: attrTranslation.name_en ?? '',
					};

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
				}),
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
		}),
	);

	// ✨ Calculate discount if exists
	const activeDiscountRelation = discounts?.[0]; // ProductDiscountRelation
	const activeDiscount = activeDiscountRelation?.discount; // ProductDiscount
	let finalPrice = rest.basePrice;
	let discountAmount = 0;
	let discountPercentage = 0;
	let hasDiscount = false;

	console.log('activeDiscountRelation', activeDiscountRelation);

	if (activeDiscount && !forEdit) {
		finalPrice = calculateDiscountedPrice(rest.basePrice, {
			type: activeDiscount.type,
			value: activeDiscount.value,
			minDiscountValue: activeDiscount.minDiscountValue,
			maxDiscountValue: activeDiscount.maxDiscountValue,
		});

		discountAmount = rest.basePrice - finalPrice;
		discountPercentage = Math.round((discountAmount / rest.basePrice) * 100);
		hasDiscount = true;
	}

	const baseProduct = {
		...rest,
		// type: rest.type,
		seoImage: seoImage ? [{ url: seoImage.url, fileId: seoImage.fileId }] : [],
		// brand: brandData,
		brand: brandData?.id || '',
		// category: categoryData,
		category: categoryData?.id || '',
		// collections: formattedCollections,
		collections: formattedCollections?.map((e) => e.id),
		// tags: formattedTags,
		tags: formattedTags?.map((e) => e.id),

		initialItems: {
			brands: brandData,
			categories: categoryData,
			collections: formattedCollections,
			tags: formattedTags,
		},

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

	// If editing mode, return without discount calculations
	if (forEdit) {
		return baseProduct;
	}

	// Return with discount information for display
	return {
		...baseProduct,
		finalPrice,
		discountAmount,
		discountPercentage,
		hasDiscount,
		// Set compareAtPrice to basePrice when discount exists
		compareAtPrice: hasDiscount ? rest.basePrice : rest.compareAtPrice,
		activeDiscount: hasDiscount
			? {
					id: activeDiscount.id,
					type: activeDiscount.type,
					value: activeDiscount.value,
					// name_ar: activeDiscount.name_ar,
					// name_en: activeDiscount.name_en,
					startDate: activeDiscount.startDate.toISOString(),
					endDate: activeDiscount.endDate?.toISOString() || null,
				}
			: null,
	};
}

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
	type: AttributeType = 'COLOR',
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
	colorHex?: string | null,
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

// 2. Helper function for handle and link images to avoid duplication
async function prepareProductImages(tx: any, images?: Array<{ fileId: string; url: string }>) {
	if (!images?.length) return undefined;

	const imageIds = await Promise.all(
		images.map(async (img) => {
			const existing = await tx.image.findFirst({ where: { fileId: img.fileId } });
			if (existing) return { id: existing.id, isNew: false };
			const created = await tx.image.create({ data: { fileId: img.fileId, url: img.url } });
			return { id: created.id, isNew: true };
		}),
	);

	return {
		create: imageIds.map((img, idx) => ({
			sortOrder: idx,
			isPrimary: idx === 0,
			image: { connect: { id: img.id } },
		})),
	};
}

// 3. helper function to create Variants
async function createVariantsForProduct(tx: any, productId: string, baseSku: string, combinations: any[]) {
	for (const combination of combinations) {
		if (!combination.checked) continue;

		const processedAttributes: Array<{ attributeId: string; attributeValueId: string }> = [];

		for (const attr of combination.attributes) {
			const attributeId = await ensureAttributeExists(tx, attr.name_ar, attr.name_en);
			const attributeValueId = await ensureAttributeValueExists(
				tx,
				attributeId,
				attr.value_ar,
				attr.value_en,
				attr.colorHex,
			);

			if (!processedAttributes.find((a) => a.attributeId === attributeId)) {
				processedAttributes.push({ attributeId, attributeValueId });
			}
		}

		const variantImages = combination.images || [];
		const existingVariantImage = combination.imageId
			? await tx.image.findUnique({ where: { id: combination.imageId } })
			: null;
		const formattedImages = await prepareProductImages(tx, variantImages);

		await tx.productVariant.create({
			data: {
				productId,
				sku: combination.sku || `${baseSku}-${combination.id}`,
				price: typeof combination.price === 'string' ? parseFloat(combination.price) : combination.price,
				compareAtPrice: combination.compareAtPrice
					? typeof combination.compareAtPrice === 'string'
						? parseFloat(combination.compareAtPrice)
						: combination.compareAtPrice
					: null,
				cost: combination.cost
					? typeof combination.cost === 'string'
						? parseFloat(combination.cost)
						: combination.cost
					: null,
				stockQuantity: combination.qty || 0,
				isActive: true,
				imageId: existingVariantImage?.id || null,
				images: formattedImages,
				options: { create: processedAttributes },
			},
		});
	}
}

// 4. helper function revalidate cache
function revalidateProductCache(path = '/dashboard/products', tag = cacheTag, profile = cacheProfile) {
	revalidatePath(path);
	revalidateTag(tag, profile);
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
	locale?: TLocalesData,
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
			include: PRODUCT_COMPLETE_INCLUDE,
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
export async function getProduct(identifier: string, locale?: TLocalesData) {
	if (!identifier) throw new AppError('api.errors.invalid_identifier', 404);

	let product: ProductWithRelations | null = null;

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
		include: PRODUCT_COMPLETE_INCLUDE,
	});

	if (!product) throw new AppError('api.errors.not_found', 404);

	const data = await formatProduct(product, locale, true);

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
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };
	}

	const skuCheck = await validateUniqueSku(data.sku);
	if (!skuCheck.success) return skuCheck as unknown as ActionResult<TProductFormValues>;

	const slugCheck = await validateUniqueSlugs(undefined, data.slug_ar, data.slug_en);
	if (!slugCheck.success) return slugCheck as unknown as ActionResult<TProductFormValues>;

	const existingSeoImage = data.seoImage?.length
		? await prisma_DB.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
		: null;
	const existingMainImage = data.images?.length
		? await prisma_DB.image.findFirst({ where: { fileId: data.images[0].fileId } })
		: null;

	const product = await prisma_DB.$transaction(async (tx) => {
		let seoImageId: string | null = existingSeoImage?.id || null;
		if (data.seoImage?.length && !existingSeoImage) {
			const createdSeoImage = await tx.image.create({
				data: { fileId: data.seoImage[0].fileId, url: data.seoImage[0].url },
			});
			seoImageId = createdSeoImage.id;
		}

		const productImages = await prepareProductImages(tx, data.images);

		const created = await tx.product.create({
			data: {
				sku: data.sku,
				brandId: data.brand || null,
				categoryId: data.category || null,
				type: data.combinations && data.combinations.length > 0 ? ProductType.VARIABLE : data.type || ProductType.SIMPLE,
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
				seoImageId: seoImageId || undefined,
				images: productImages,
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
				collections: data.collections?.length
					? { create: data.collections.map((id) => ({ collectionId: id })) }
					: undefined,
				tags: data.tags?.length ? { create: data.tags.map((id) => ({ tagId: id })) } : undefined,
				specifications: data.specifications?.length
					? {
							create: data.specifications.map((spec, sIdx) => ({
								title_ar: spec.title_ar,
								title_en: spec.title_en,
								sortOrder: sIdx,
								properties: {
									create: spec.properties.map((p, pIdx) => ({
										key_ar: p.key_ar,
										key_en: p.key_en,
										value_ar: p.value_ar,
										value_en: p.value_en,
										sortOrder: pIdx,
									})),
								},
							})),
						}
					: undefined,
			},
		});

		if (data.combinations && data.combinations.length > 0) {
			await createVariantsForProduct(tx, created.id, data.sku, data.combinations);
		}

		return created;
	});

	const completeProduct = await prisma_DB.product.findUnique({
		where: { id: product.id },
		include: PRODUCT_COMPLETE_INCLUDE,
	});

	revalidateProductCache();
	const formattedData = await formatProduct(completeProduct as ProductWithRelations);
	logger.info(`✅ Product created: ${product.id}`, { context: 'ProductService' });

	return { success: true, status: 201, data: formattedData as TProductFormValues, message: 'api.products.success.create' };
}

/**
 * 🟡 Update Product
 */
export async function updateProduct(id: string, data: TProductFormValues): Promise<ActionResult<TProductFormValues>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const validation = await ValidateFormAction(formSchemaProduct, data);
	if (!validation.success) {
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };
	}

	const skuCheck = await validateUniqueSku(data.sku, id);
	if (!skuCheck.success) return skuCheck as unknown as ActionResult<TProductFormValues>;

	await prisma_DB.$transaction(async (tx) => {
		const existingSeoImage = data.seoImage?.length
			? await tx.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
			: null;
		const existingMainImage = data.images?.length
			? await tx.image.findFirst({ where: { fileId: data.images[0].fileId } })
			: null;

		let seoImageId: string | null = existingSeoImage?.id || null;
		if (data.seoImage?.length && !existingSeoImage) {
			const createdSeoImage = await tx.image.create({
				data: { fileId: data.seoImage[0].fileId, url: data.seoImage[0].url },
			});
			seoImageId = createdSeoImage.id;
		}

		const productImages = await prepareProductImages(tx, data.images);

		await tx.product.update({
			where: { id },
			data: {
				sku: data.sku,
				brandId: data.brand || null,
				categoryId: data.category || null,
				type:
					data.combinations && data.combinations?.length > 0 ? ProductType.VARIABLE : data.type || ProductType.SIMPLE,
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
				seoImageId: seoImageId || undefined,
				images: data.images?.length ? { deleteMany: {}, ...productImages } : undefined,
			},
		});

		// update translations
		for (const lang of Object.keys(localesData) as TLocalesData[]) {
			const translationData = {
				name: data[`name_${lang}`],
				slug: data[`slug_${lang}`],
				description: data[`description_${lang}`],
				shortDescription: data[`shortDescription_${lang}`],
				seoTitle: data[`seoTitle_${lang}`],
				seoDescription: data[`seoDescription_${lang}`],
				seoKeywords: data[`seoKeywords_${lang}`],
			};

			await tx.productTranslation.upsert({
				where: { productId_lang: { productId: id, lang } }, // تأكد أن لديك unique index في بريزما على productId و lang معاً
				update: translationData,
				create: { productId: id, lang, ...translationData },
			});
		}

		// update collections
		if (data.collections !== undefined) {
			await tx.collectionProduct.deleteMany({ where: { productId: id } });
			if (data.collections.length > 0) {
				await tx.collectionProduct.createMany({
					data: data.collections.map((cId) => ({ productId: id, collectionId: cId })),
				});
			}
		}

		// update tags
		if (data.tags !== undefined) {
			await tx.productTag.deleteMany({ where: { productId: id } });
			if (data.tags.length > 0) {
				await tx.productTag.createMany({ data: data.tags.map((tId) => ({ productId: id, tagId: tId })) });
			}
		}

		// update Specifications
		if (data.specifications !== undefined) {
			const existingSpecs = await tx.productSpecification.findMany({
				where: { productId: id },
				include: { properties: true },
			});
			const incomingSpecIds = new Set(data.specifications.filter((s) => s.id).map((s) => s.id!));

			const specsToDelete = existingSpecs.filter((s) => !incomingSpecIds.has(s.id));
			if (specsToDelete.length > 0) {
				await tx.productSpecification.deleteMany({ where: { id: { in: specsToDelete.map((s) => s.id) } } });
			}

			for (let i = 0; i < data.specifications.length; i++) {
				const spec = data.specifications[i];
				if (spec.id && existingSpecs.some((s) => s.id === spec.id)) {
					const existingSpec = existingSpecs.find((s) => s.id === spec.id)!;
					const incomingPropIds = new Set(spec.properties.filter((p) => p.id).map((p) => p.id!));

					const propsToDelete = existingSpec.properties.filter((p) => !incomingPropIds.has(p.id));
					if (propsToDelete.length > 0) {
						await tx.productSpecificationProperty.deleteMany({
							where: { id: { in: propsToDelete.map((p) => p.id) } },
						});
					}

					for (let j = 0; j < spec.properties.length; j++) {
						const prop = spec.properties[j];
						if (prop.id && existingSpec.properties.some((p) => p.id === prop.id)) {
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

					await tx.productSpecification.update({
						where: { id: spec.id },
						data: { title_ar: spec.title_ar, title_en: spec.title_en, sortOrder: i },
					});
				} else {
					await tx.productSpecification.create({
						data: {
							productId: id,
							title_ar: spec.title_ar,
							title_en: spec.title_en,
							sortOrder: i,
							properties: {
								create: spec.properties.map((prop, pIdx) => ({
									key_ar: prop.key_ar,
									key_en: prop.key_en,
									value_ar: prop.value_ar,
									value_en: prop.value_en,
									sortOrder: pIdx,
								})),
							},
						},
					});
				}
			}
		}

		// update Variants
		if (data.combinations !== undefined) {
			await tx.productVariant.deleteMany({ where: { productId: id } });
			await createVariantsForProduct(tx, id, data.sku, data.combinations);
		}
	});

	const product = await prisma_DB.product.findUnique({
		where: { id },
		include: PRODUCT_COMPLETE_INCLUDE,
	});

	if (!product) throw new AppError('api.errors.not_found', 404);

	revalidateProductCache();
	const formattedData = await formatProduct(product as ProductWithRelations);
	logger.info(`✅ Product updated: ${product.id}`, { context: 'ProductService' });

	return { success: true, status: 200, data: formattedData as TProductFormValues, message: 'api.products.success.update' };
}

/**
 * 🟢 Toggle Active Status
 */
export async function toggleStateProduct(
	id: string,
	isActive: boolean,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
	const updated = await prisma_DB.product.update({
		where: { id },
		data: { isActive },
		select: { id: true, isActive: true },
	});

	revalidateTag(cacheTag, cacheProfile);

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
	isFeatured: boolean,
): Promise<ActionResult<{ id: string; isFeatured: boolean }>> {
	const updated = await prisma_DB.product.update({
		where: { id },
		data: { isFeatured },
		select: { id: true, isFeatured: true },
	});

	revalidateTag(cacheTag, cacheProfile);

	return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
}

/**
 * 🔴 Delete Product
 */
export async function deleteProduct(id: string): Promise<ActionResult<null>> {
	await prisma_DB.product.delete({ where: { id } });

	revalidateTag(cacheTag, cacheProfile);
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

	revalidateTag(cacheTag, cacheProfile);
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
	operation: 'add' | 'subtract' | 'set' = 'set',
): Promise<ActionResult<{ id: string; stockQuantity: number }>> {
	const product = await prisma_DB.product.findUnique({ where: { id }, select: { stockQuantity: true } });

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

	revalidateTag(cacheTag, cacheProfile);

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

	revalidateTag(cacheTag, cacheProfile);
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
			...PRODUCT_COMPLETE_INCLUDE,
			orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
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
 * 🔹 Get Related Products
 */
export async function getRelatedProducts(
	productId: string,
	limit = 6,
	locale?: TLocalesData,
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
		include: PRODUCT_COMPLETE_INCLUDE,
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
		where: { sku, ...(excludeId && { id: { not: excludeId } }) },
		select: { id: true },
	});

	return { success: true, status: 200, data: { available: !product } };
}

/**
 * 🔹 Check Slug Availability
 */
export async function checkSlugAvailability(
	slug: string,
	lang: 'ar' | 'en',
	excludeProductId?: string,
): Promise<ActionResult<{ available: boolean }>> {
	const translation = await prisma_DB.productTranslation.findFirst({
		where: {
			slug,
			lang,
			...(excludeProductId && { productId: { not: excludeProductId } }),
		},
		select: { id: true },
	});

	return { success: true, status: 200, data: { available: !translation } };
}

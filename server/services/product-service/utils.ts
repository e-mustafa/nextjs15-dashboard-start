import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { fields, TProductFormValues } from '@/validation/product-validation';
import { AttributeType, Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { calculateDiscountedPrice } from '../utils';
import { ProductWithRelations, SpecificationSection, TProduct } from './types';

export const tag = 'products';
export const profile = 'max';

/////////////////////////
// HELPERS
/////////////////////////

/**
 * Format product data with translations and fallback
 */
export async function formatProduct(
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
			brands: brandData ? [brandData] : [],
			categories: categoryData ? [categoryData] : [],
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
export function buildProductWhereClause(params: {
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
export async function ensureAttributeExists(
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
export async function ensureAttributeValueExists(
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
export async function validateUniqueSku(sku: string, excludeId?: string): Promise<ActionResult<null>> {
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
export async function validateUniqueSlugs(id?: string, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
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
export async function prepareProductImages(tx: any, images?: Array<{ fileId: string; url: string }>) {
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
export async function createVariantsForProduct(tx: any, productId: string, baseSku: string, combinations: any[]) {
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
export function revalidateProductCache(
	path = '/dashboard/products',
	cacheTag: string = tag,
	cacheProfile: string = profile,
) {
	revalidatePath(path);
	revalidateTag(cacheTag, cacheProfile);
}

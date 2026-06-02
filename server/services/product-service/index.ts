'use server';

import { localesData, TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchemaProduct, TProductFormValues } from '@/validation/product-validation';
import { ProductType } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { ProductWithRelations, TProduct } from './types';
import { buildProductWhereClause, createVariantsForProduct, formatProduct, prepareProductImages, profile, revalidateProductCache, tag, validateUniqueSku, validateUniqueSlugs } from './utils';
import { PRODUCT_COMPLETE_INCLUDE } from './prisma-includes';


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

	revalidateTag(tag, profile);

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

	revalidateTag(tag, profile);

	return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
}

/**
 * 🔴 Delete Product
 */
export async function deleteProduct(id: string): Promise<ActionResult<null>> {
	await prisma_DB.product.delete({ where: { id } });

	revalidateTag(tag, profile);
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

	revalidateTag(tag, profile);
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

	revalidateTag(tag, profile);

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

	revalidateTag(tag, profile);
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

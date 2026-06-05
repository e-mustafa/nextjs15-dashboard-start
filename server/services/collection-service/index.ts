'use server';
import { localesData, TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { parseListParams } from '@/lib/utils.server/query';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchemaCollection } from '@/validation/collection-validation';
import { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Collection, CollectionWithRelations, TFormValues } from './types';
import { COLLECTION_COMPLETE_INCLUDE, formatCollection, validateUniqueSlugs } from './utils';

// temporarily
let user: { id: string; name: string } | null = null;

const PATH = '/dashboard/collections';
const TAG = 'collections';
const PROFILE = 'max';

/** 🔹 Get All Collections */
export async function getAllCollections(
	params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
	locale?: TLocalesData,
): Promise<ActionResult<Collection>> {
	// const cookiesStore = await cookies();
	// const userCookie = cookiesStore.get('user')?.value;
	// if (userCookie) {
	// 	try {
	// 		user = JSON.parse(userCookie);
	// 	} catch {
	// 		user = null;
	// 	}
	// }

	const { page, limit, skip, search, sortBy, sortOrder } = parseListParams(params, {
		sortableFields: ['name', 'slug', 'createdAt', 'sortOrder'],
		defaultSortOrder: 'asc',
	});

	const localeKey = (locale?.split('-')[0] as 'ar' | 'en') || 'en';
	const localizedFields = ['name', 'slug'];
	const finalSortKey = localizedFields.includes(sortBy) ? `${sortBy}_${localeKey}` : sortBy;

	const orderBy = { [finalSortKey]: sortOrder };

	const where: Prisma.CollectionWhereInput = search
		? {
				OR: [
					{ translations: { some: { name: { contains: search, mode: 'insensitive' } } } },
					{ translations: { some: { slug: { contains: search, mode: 'insensitive' } } } },
					{ translations: { some: { description: { contains: search, mode: 'insensitive' } } } },
				],
			}
		: {};

	const [collections, total] = await Promise.all([
		prisma_DB.collection.findMany({
			where,
			skip,
			take: limit,
			include: COLLECTION_COMPLETE_INCLUDE,
			orderBy,
		}),
		prisma_DB.collection.count({ where }),
	]);
	console.log('collections--', collections);

	const data = await Promise.all(collections?.map((c) => formatCollection(c, locale)));
	return {
		success: true,
		status: 200,
		data: data as Collection[],
		meta: {
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
			sort: { by: sortBy, order: sortOrder },
		},
	};
}

/** 🔹 Get Collection By ID */
export async function getCollection(id: string, locale?: TLocalesData) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const collection = await prisma_DB.collection.findUnique({
		where: { id },
		include: COLLECTION_COMPLETE_INCLUDE,
	});

	if (!collection) throw new AppError('api.collections.errors.not_found', 404);

	const data = await formatCollection(collection, locale, true);
	return { success: true, status: 200, data };
}

/** 🟢 Create Collection */
export async function createCollection(data: TFormValues): Promise<ActionResult<TFormValues>> {
	const validation = await ValidateFormAction(formSchemaCollection, data);
	if (!validation.success)
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };

	const unique = await validateUniqueSlugs(undefined, data.slug_ar, data.slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TFormValues>;

	const existingSeoImage = data.seoImage?.length
		? await prisma_DB.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
		: null;

	const collection = await prisma_DB.collection.create({
		data: {
			isActive: data.isActive,
			isFeatured: data.isFeatured ?? false,
			// sortOrder: data.sortOrder ?? 0,
			images: data.images?.length
				? {
						create: await Promise.all(
							data.images.map(async (img, idx) => {
								const existingImage = await prisma_DB.image.findFirst({ where: { fileId: img.fileId } });
								return {
									sortOrder: idx,
									image: existingImage
										? { connect: { id: existingImage.id } }
										: { create: { fileId: img.fileId, url: img.url } },
								};
							}),
						),
					}
				: undefined,

			seoImage: data.seoImage?.length
				? existingSeoImage
					? { connect: { id: existingSeoImage.id } }
					: { create: { fileId: data.seoImage[0].fileId, url: data.seoImage[0].url } }
				: undefined,

			translations: {
				create: [
					{
						lang: 'ar',
						slug: data.slug_ar,
						name: data.name_ar,
						description: data.description_ar ?? '',
						seoTitle: data.seoTitle_ar ?? '',
						seoDescription: data.seoDescription_ar ?? '',
						seoKeywords: data.seoKeywords_ar ?? '',
					},
					{
						lang: 'en',
						slug: data.slug_en,
						name: data.name_en,
						description: data.description_en ?? '',
						seoTitle: data.seoTitle_en ?? '',
						seoDescription: data.seoDescription_en ?? '',
						seoKeywords: data.seoKeywords_en ?? '',
					},
				],
			},
		},
		include: COLLECTION_COMPLETE_INCLUDE,
	});

	revalidatePath(PATH);
	const formattedData = await formatCollection(collection as CollectionWithRelations);
	logger.info(`✅ Collection created: ${collection.id}`, { context: 'CollectionService' });

	return { success: true, status: 201, data: formattedData as TFormValues, message: 'api.collections.success.create' };
}

/** 🟡 Update Collection */
export async function updateCollection(id: string, data: TFormValues): Promise<ActionResult<TFormValues>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const validation = await ValidateFormAction(formSchemaCollection, data);
	if (!validation.success)
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };

	const unique = await validateUniqueSlugs(id, data.slug_ar, data.slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TFormValues>;

	const langs = Object.keys(localesData) as TLocalesData[];

	await prisma_DB.$transaction(async (tx) => {
		const existingSeoImage = data.seoImage?.length
			? await tx.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
			: null;

		await tx.collection.update({
			where: { id },
			data: {
				isActive: data.isActive,
				isFeatured: data.isFeatured ?? false,
				// sortOrder: data.sortOrder ?? 0,
				images: data.images?.length
					? {
							deleteMany: {},
							create: await Promise.all(
								data.images.map(async (img, idx) => {
									const existingImage = await tx.image.findFirst({ where: { fileId: img.fileId } });
									return {
										sortOrder: idx,
										image: existingImage
											? { connect: { id: existingImage.id } }
											: { create: { fileId: img.fileId, url: img.url } },
									};
								}),
							),
						}
					: undefined,
				seoImage: data.seoImage?.length
					? existingSeoImage
						? { connect: { id: existingSeoImage.id } }
						: { create: { fileId: data.seoImage[0].fileId, url: data.seoImage[0].url } }
					: undefined,

				// For translations, we can use upsert with a unique constraint on (collectionId, lang)
				translations: {
					upsert: (Object.keys(localesData) as TLocalesData[]).map((lang: TLocalesData) => ({
						where: { collectionId_lang: { collectionId: id, lang } }, // this requires a unique constraint in the Prisma schema
						update: {
							slug: data[`slug_${lang}`],
							name: data[`name_${lang}`],
							description: data[`description_${lang}`],
							seoTitle: data[`seoTitle_${lang}`],
							seoDescription: data[`seoDescription_${lang}`],
							seoKeywords: data[`seoKeywords_${lang}`],
						},
						create: {
							lang,
							slug: data[`slug_${lang}`],
							name: data[`name_${lang}`],
							description: data[`description_${lang}`],
							seoTitle: data[`seoTitle_${lang}`],
							seoDescription: data[`seoDescription_${lang}`],
							seoKeywords: data[`seoKeywords_${lang}`],
						},
					})),
				},
			},
		});
	});

	const collection = await prisma_DB.collection.findUnique({
		where: { id },
		include: COLLECTION_COMPLETE_INCLUDE,
	});

	if (!collection) throw new AppError('api.collections.errors.not_found', 404);

	revalidateTag(TAG, PROFILE);
	const formattedData = await formatCollection(collection as CollectionWithRelations);
	logger.info(`✅ Collection updated: ${collection.id}`, { context: 'CollectionService' });

	return { success: true, status: 200, data: formattedData as TFormValues, message: 'api.collections.success.update' };
}

/** 🟢 Toggle Active */
export async function toggleStateCollection(id: string, isActive: boolean) {
	const updated = await prisma_DB.collection.update({
		where: { id },
		data: { isActive },
		select: { id: true, isActive: true },
	});
	revalidateTag(TAG, PROFILE);
	return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
}

/** 🟢 Toggle Featured */
export async function toggleFeaturedCollection(id: string, isFeatured: boolean) {
	const updated = await prisma_DB.collection.update({
		where: { id },
		data: { isFeatured },
		select: { id: true, isFeatured: true },
	});
	revalidateTag(TAG, PROFILE);
	return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
}

/** 🔴 Delete */
export async function deleteCollection(id: string) {
	await prisma_DB.collection.delete({ where: { id } });
	revalidateTag(TAG, PROFILE);
	logger.info(`✅ Collection deleted: ${id}`, { context: 'CollectionService' });
	return { success: true, status: 200, data: null, message: 'api.collections.success.delete' };
}

/** 🔴 Delete Many */
export async function deleteManyCollections(ids: string[]) {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	const deleted = await prisma_DB.collection.deleteMany({ where: { id: { in: ids } } });
	if (!deleted.count) throw new AppError('api.collections.errors.delete', 404);

	revalidateTag(TAG, PROFILE);
	logger.info(`✅ ${deleted.count} collections deleted`, { context: 'CollectionService' });
	return { success: true, status: 200, data: null, message: 'api.collections.success.delete_many' };
}

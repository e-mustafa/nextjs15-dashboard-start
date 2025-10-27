'use server';
import { localesData, TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult, TImage } from '@/types/api';
import { fields, formSchemaCollection, TCollectionFormValues } from '@/validation/collection-validation';
import { Prisma } from '@prisma/client';
import { revalidatePath, updateTag } from 'next/cache';
import { cookies } from 'next/headers';

type TFormValues = TCollectionFormValues;

let user: { id: string; name: string } | null = null;

type CollectionWithRelations = Prisma.CollectionGetPayload<{
	include: { translations: true; images: { include: { image: true } }; seoImage: true };
}>;

export type Collection = {
	id: string;
	name: string;
	description?: string;
	slug?: string;
	isActive: boolean;
	isFeatured: boolean;
	sortOrder: number;
	seoTitle?: string;
	seoDescription?: string;
	seoKeywords?: string;
	createdAt?: string;
	updatedAt?: string;
	images?: TImage[];
	seoImage?: TImage;
};

async function formatCollection(
	collection: CollectionWithRelations,
	acceptLanguage?: string
): Promise<TFormValues | Collection> {
	const { translations, images, seoImage, ...rest } = collection;

	const translationData = await mapTranslations(translations, {
		accept_language: acceptLanguage,
		fields,
	});

	return {
		...rest,
		images: images?.map((img) => ({
			url: img.image?.url ?? '',
			fileId: img.image?.fileId ?? '',
		})),
		seoImage: seoImage ? [{ url: seoImage?.url, fileId: seoImage?.fileId }] : [],
		...(translationData as TFormValues),
	};
}

async function validateUniqueSlugs(id?: string, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
	const or: Prisma.CollectionTranslationWhereInput[] = [];
	if (slug_ar) or.push({ lang: 'ar', slug: slug_ar });
	if (slug_en) or.push({ lang: 'en', slug: slug_en });
	if (!or.length) return { success: true, status: 200, data: null };

	const where: Prisma.CollectionTranslationWhereInput = {
		OR: or,
		...(id ? { collectionId: { not: id } } : {}),
	};

	const duplicate = await prisma_DB.collectionTranslation.findFirst({ where });
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

/** 🔹 Get All Collections */
export async function getAllCollections(
	params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
	locale?: TLocalesData
): Promise<ActionResult<Collection>> {
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

	const sortableFields = ['name', 'slug', 'createdAt', 'sortOrder'];
	const sortBy = sortableFields.includes(params?.sortBy || '') ? params?.sortBy : undefined;
	const sortOrder = params?.sortOrder === 'desc' ? 'desc' : 'asc';
	const localeKey = locale?.split('-')[0] || 'en';

	const orderBy = sortBy ? { [`${sortBy}_${localeKey}`]: sortOrder } : undefined;

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
			include: {
				translations: true,
				images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
				seoImage: true,
			},
			orderBy,
		}),
		prisma_DB.collection.count({ where }),
	]);

	const data = await Promise.all(collections.map((c) => formatCollection(c, locale)));
	return {
		success: true,
		status: 200,
		data: data as Collection[],
		meta: {
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
			sort: sortBy ? { by: sortBy, order: sortOrder } : undefined,
		},
	};
}

/** 🔹 Get Collection By ID */
export async function getCollection(id: string) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const collection = await prisma_DB.collection.findUnique({
		where: { id },
		include: { translations: true, images: { include: { image: true }, orderBy: { sortOrder: 'asc' } }, seoImage: true },
	});

	if (!collection) throw new AppError('api.collections.errors.not_found', 404);

	const data = await formatCollection(collection);
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
							})
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
		include: { translations: true, images: { include: { image: true }, orderBy: { sortOrder: 'asc' } }, seoImage: true },
	});

	revalidatePath('/dashboard/collections');
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
								})
							),
					  }
					: undefined,
				seoImage: data.seoImage?.length
					? existingSeoImage
						? { connect: { id: existingSeoImage.id } }
						: { create: { fileId: data.seoImage[0].fileId, url: data.seoImage[0].url } }
					: undefined,
			},
		});

		const langs = Object.keys(localesData) as TLocalesData[];
		for (const lang of langs) {
			const slug = data[`slug_${lang}`];
			const name = data[`name_${lang}`];
			const description = data[`description_${lang}`];
			const seoTitle = data[`seoTitle_${lang}`];
			const seoDescription = data[`seoDescription_${lang}`];
			const seoKeywords = data[`seoKeywords_${lang}`];

			const existing = await tx.collectionTranslation.findFirst({ where: { collectionId: id, lang } });
			if (existing) {
				await tx.collectionTranslation.update({
					where: { id: existing.id },
					data: { slug, name, description, seoTitle, seoDescription, seoKeywords },
				});
			} else {
				await tx.collectionTranslation.create({
					data: { collectionId: id, lang, slug, name, description, seoTitle, seoDescription, seoKeywords },
				});
			}
		}
	});

	const collection = await prisma_DB.collection.findUnique({
		where: { id },
		include: { translations: true, images: { include: { image: true }, orderBy: { sortOrder: 'asc' } }, seoImage: true },
	});

	if (!collection) throw new AppError('api.collections.errors.not_found', 404);

	updateTag('collections');
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
	updateTag('collections');
	return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
}

/** 🟢 Toggle Featured */
export async function toggleFeaturedCollection(id: string, isFeatured: boolean) {
	const updated = await prisma_DB.collection.update({
		where: { id },
		data: { isFeatured },
		select: { id: true, isFeatured: true },
	});
	updateTag('collections');
	return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
}

/** 🔴 Delete */
export async function deleteCollection(id: string) {
	await prisma_DB.collection.delete({ where: { id } });
	updateTag('collections');
	logger.info(`✅ Collection deleted: ${id}`, { context: 'CollectionService' });
	return { success: true, status: 200, data: null, message: 'api.collections.success.delete' };
}

/** 🔴 Delete Many */
export async function deleteManyCollections(ids: string[]) {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);
	const deleted = await prisma_DB.collection.deleteMany({ where: { id: { in: ids } } });
	if (!deleted.count) throw new AppError('api.collections.errors.delete', 404);

	updateTag('collections');
	logger.info(`✅ ${deleted.count} collections deleted`, { context: 'CollectionService' });
	return { success: true, status: 200, data: null, message: 'api.collections.success.delete_many' };
}

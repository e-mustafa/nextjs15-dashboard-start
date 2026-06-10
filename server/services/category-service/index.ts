'use server';
import { localesData, TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { parseListParams } from '@/lib/utils.server/query';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchemaCategory } from '@/validation/category-validation';
import { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Category, CategoryWithRelations, TFormValues } from './types';
import { CATEGORY_COMPLETE_INCLUDE, formatCategory, validateUniqueSlugs } from './utils';

// temporarily
let user: { id: string; name: string } | null = null;

const PATH = '/dashboard/categories';
const TAG = 'categories';
const PROFILE = 'max';

/** 🔹 Get All Categories */
export async function getAllCategories(
	params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
	locale?: TLocalesData,
): Promise<ActionResult<Category>> {
	// const cookiesStore = await cookies();
	// const userCookie = cookiesStore.get('user')?.value;
	// if (userCookie) {
	// 	try {
	// 		user = JSON.parse(userCookie);
	// 	} catch {
	// 		user = null;
	// 	}
	// }

	// const page = Number(params?.page) || 1;
	// const limit = Number(params?.limit) || 10;
	// const search = params?.search?.trim() || '';
	// const skip = (page - 1) * limit;

	// const sortableFields = ['name', 'slug', 'createdAt'];
	// const sortBy = sortableFields.includes(params?.sortBy || '') ? params?.sortBy : undefined;
	// const sortOrder = params?.sortOrder === 'desc' ? 'desc' : 'asc';

	const { page, limit, skip, search, sortBy, sortOrder } = parseListParams(params, {
		sortableFields: ['name', 'slug', 'createdAt'],
		defaultSortOrder: 'asc',
	});

	const localeKey = (locale?.split('-')[0] as 'ar' | 'en') || 'en';
	const localizedFields = ['name', 'slug'];
	const finalSortKey = localizedFields.includes(sortBy) ? `${sortBy}_${localeKey}` : sortBy;

	const orderBy = { [finalSortKey]: sortOrder };

	const where: Prisma.CategoryWhereInput = search
		? {
				OR: [
					{ translations: { some: { name: { contains: search, mode: 'insensitive' } } } },
					{ translations: { some: { slug: { contains: search, mode: 'insensitive' } } } },
					{ translations: { some: { description: { contains: search, mode: 'insensitive' } } } },
				],
			}
		: {};

	const [categories, total] = await Promise.all([
		prisma_DB.category.findMany({
			where,
			skip,
			take: limit,
			include: CATEGORY_COMPLETE_INCLUDE,
			orderBy,
		}),
		prisma_DB.category.count({ where }),
	]);

	// if (!categories.length) throw new AppError('api.errors.not_found', 404);

	const data = await Promise.all(categories.map((category) => formatCategory(category, locale)));
	return {
		success: true,
		status: 200,
		data: data as Category[],
		meta: {
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
			sort: { by: sortBy, order: sortOrder },
		},
	};
}

/** 🔹 Get Category By ID */
export async function getCategory(id: string, locale?: TLocalesData) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const category = await prisma_DB.category.findUnique({
		where: { id },
		include: CATEGORY_COMPLETE_INCLUDE,
	});

	if (!category) throw new AppError('api.categories.errors.not_found', 404);

	const data = await formatCategory(category, locale, true);
	return { success: true, status: 200, data };
}

/** 🟢 Create Category */
export async function createCategory(data: TFormValues): Promise<ActionResult<TFormValues>> {
	const validation = await ValidateFormAction(formSchemaCategory, data);
	if (!validation.success)
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };

	const unique = await validateUniqueSlugs(undefined, data.slug_ar, data.slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TFormValues>;

	// 🔹 handel seo image
	const existingSeoImage = data.seoImage?.length
		? await prisma_DB.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
		: null;

	const category = await prisma_DB.category.create({
		data: {
			isActive: data.isActive,
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
			
			// 🔹 connect products
			products: data?.products?.length ? { connect: data.products.map((id) => ({ id })) } : undefined,
		},
		include: CATEGORY_COMPLETE_INCLUDE,
	});

	revalidatePath(PATH);
	const formattedData = await formatCategory(category as CategoryWithRelations);
	logger.info(`✅ Category created: ${category.id}`, { context: 'CategoryService' });

	return { success: true, status: 201, data: formattedData as TFormValues, message: 'api.categories.success.create' };
}

/** 🟡 Update Category */
export async function updateCategory(id: string, data: TFormValues): Promise<ActionResult<TFormValues>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const validation = await ValidateFormAction(formSchemaCategory, data);
	if (!validation.success)
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };

	const unique = await validateUniqueSlugs(id, data.slug_ar, data.slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TFormValues>;

	await prisma_DB.$transaction(async (tx) => {
		// 🔹 handel seo image
		const existingSeoImage = data.seoImage?.length
			? await tx.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
			: null;

		// 🔹 update data and images
		await tx.category.update({
			where: { id },
			data: {
				isActive: data.isActive,
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

				// 🔹 update translations
				// For translations, we can use upsert with a unique constraint on (categoryId, lang)
				translations: {
					upsert: (Object.keys(localesData) as TLocalesData[]).map((lang: TLocalesData) => ({
						where: { categoryId_lang: { categoryId: id, lang } }, // this requires a unique constraint in the Prisma schema
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

				// 🔹 sync products (connect new, disconnect removed)
				products: data.products !== undefined ? { set: data.products.map((id) => ({ id })) } : undefined,
			},
		});
	});

	// 🔄 get updated data after update
	const category = await prisma_DB.category.findUnique({
		where: { id },
		include: CATEGORY_COMPLETE_INCLUDE,
	});

	if (!category) throw new AppError('api.categories.errors.not_found', 404);

	revalidateTag(TAG, PROFILE);

	const formattedData = await formatCategory(category as CategoryWithRelations);
	logger.info(`✅ Category updated: ${category.id}`, { context: 'CategoryService' });
	return { success: true, status: 200, data: formattedData as TFormValues, message: 'api.categories.success.update' };
}

/** 🟡 Toggle State Category */
export async function toggleStateCategory(id: string, isActive: boolean) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const updated = await prisma_DB.category.update({
		where: { id },
		data: { isActive },
		select: { id: true, isActive: true },
	});

	if (!updated) throw new AppError('api.errors.update_status', 404);

	revalidateTag(TAG, PROFILE);
	logger.info(`✅ Category updated: ${updated.id}`, { context: 'CategoryService' });
	return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
}

/** 🔴 Delete Category */
export async function deleteCategory(id: string) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	await prisma_DB.category.delete({ where: { id } });
	revalidateTag(TAG, PROFILE);

	logger.info(`✅ Category deleted: ${id} by ${user?.name}`, { context: 'CategoryService' });
	return { success: true, status: 200, data: null, message: 'api.categories.success.delete' };
}

/** 🔴 Delete Categories */
export async function deleteManyCategories(ids: string[]) {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	const deleted = await prisma_DB.category.deleteMany({ where: { id: { in: ids } } });
	if (!deleted.count) throw new AppError('api.categories.errors.delete', 404);

	revalidateTag(TAG, PROFILE);
	logger.info(`✅ ${deleted.count} categories deleted by ${user?.name}`, { context: 'CategoryService' });
	return { success: true, status: 200, data: null, message: 'api.categories.success.delete_many' };
}

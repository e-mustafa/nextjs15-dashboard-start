import { TCategoryFormValues } from '@/components/Dashboard/forms/category-form';
import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchema_category } from '@/validation/category-validation';
import { Prisma } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

export const categoryFields = ['name', 'description', 'slug', 'seo_title', 'seo_description', 'seo_keywords'];

// get user info from cookies
let user: { id: string; name: string } | null = null;

type CategoryWithRelations = Prisma.CategoryGetPayload<{
	include: { translations: true; image: true; seo_image: true };
}>;

export type CategoryFormatted = Awaited<ReturnType<typeof formatCategory>>;
export type TImage = { url: string; fileId: string };
type TTypeFormValues = TCategoryFormValues;

export type Category = {
	id: string;
	name: string;
	description?: string;
	slug?: string;
	seo_title?: string;
	seo_description?: string;
	seo_keywords?: string;
	createdAt?: string;
	image?: string | TImage;
	seo_image?: string | TImage;
};

async function formatCategory(
	category: CategoryWithRelations,
	acceptLanguage?: string
): Promise<TTypeFormValues | Category> {
	const restData = await mapTranslations(category.translations, {
		accept_language: acceptLanguage,
		fields: categoryFields,
	});

	return {
		id: category.id,
		image: category?.image,
		seo_image: category?.seo_image,
		...(restData as TTypeFormValues),
	};
}

/**
 * 🔍 check slug unused in another lang in any Category
 */
async function validateUniqueSlugs(id: string | undefined, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
	const or: Prisma.CategoryTranslationWhereInput[] = [];
	if (slug_ar) or.push({ lang: 'ar', slug: slug_ar });
	if (slug_en) or.push({ lang: 'en', slug: slug_en });
	if (or.length === 0) return { success: true, status: 200, data: null };

	const where: Prisma.CategoryTranslationWhereInput = {
		OR: or,
		...(id ? { categoryId: { not: id } } : {}),
	};

	const duplicate = await prisma_DB.categoryTranslation.findFirst({ where });
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

export async function getAllCategories(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
): Promise<ActionResult<Category>> {
	const cookiesStore = await cookies();
	const userCookie = cookiesStore.get('user')?.value;
	if (userCookie) {
		try {
			user = JSON.parse(userCookie);
			console.log('user', user);
		} catch {
			user = null;
		}
	}

	const page = Number(params?.page) || 1;
	const limit = Number(params?.limit) || 10;
	const search = params?.search?.trim() || '';
	const skip = (page - 1) * limit;

	const sortableFields = ['name', 'slug', 'description'];
	const sortBy = params?.sortBy;
	const sortOrder = params?.sortOrder ? (params?.sortOrder === 'asc' ? 'asc' : 'desc') : 'asc';

	// Extract short locale key (e.g. "ar" or "en")
	const localeKey = locale?.split('-')[0] || locale || 'en';

	// Build correct DB field name (e.g. "name_ar")
	const orderBy = sortBy && sortableFields.includes(sortBy) ? { [`${sortBy}_${localeKey}`]: sortOrder } : undefined;

	const where: Prisma.CategoryWhereInput = search
		? {
				OR: [
					{ translations: { some: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
					{ translations: { some: { slug: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
					{ translations: { some: { description: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
				],
		  }
		: {};

	const [categories, total] = await Promise.all([
		prisma_DB.category.findMany({
			where,
			skip,
			take: limit,
			include: { translations: true, image: true, seo_image: true },
			...(orderBy ? { orderBy } : {}),
		}),
		prisma_DB.category.count({ where }),
	]);

	// if (!categories.length) throw new AppError('api.errors.not_found', 404);

	console.log('categories--', categories[0]);

	const data = (await Promise.all(categories.map((b) => formatCategory(b, locale)))) as Category[];
	console.log('category data:', data);
	return {
		success: true,
		status: 200,
		data,
		// all_Data: categories,
		meta: {
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
			sort: sortBy ? { by: sortBy, order: sortOrder } : undefined,
			query: search ? { search } : undefined,
		},
	};
}

export async function getCategory(id: string) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const category = await prisma_DB.category.findUnique({
		where: { id },
		include: { translations: true, image: true, seo_image: true },
	});
	if (!category) throw new AppError('api.categories.errors.not_found', 404);

	const data = await formatCategory(category);
	return { success: true, status: 200, data };
}

/**
 * 🟢 create new Category
 */
export async function createCategory(data: TTypeFormValues): Promise<ActionResult<CategoryFormatted>> {
	const validation = await ValidateFormAction(formSchema_category, data);
	if (!validation.success) {
		return {
			...validation,
			form_errors: JSON.stringify(validation.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	const {
		name_ar,
		name_en,
		description_ar,
		description_en,
		slug_ar,
		slug_en,
		image,
		seo_image,
		seo_title_ar,
		seo_title_en,
		seo_description_ar,
		seo_description_en,
		seo_keywords_ar,
		seo_keywords_en,
	} = data;

	const unique = await validateUniqueSlugs(undefined, slug_ar, slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TTypeFormValues>;

	// ⚙️ transaction: create category + image + translations
	const categoryId = await prisma_DB.$transaction(
		async (tx) => {
			// ✳️ create base category
			const category = await tx.category.create({
				data: {},
			});

			// 🖼️ optional image create
			if (image?.length) {
				await tx.category.update({
					where: { id: category.id },
					data: {
						image: {
							create: {
								fileId: image[0].fileId,
								url: image[0].url,
							},
						},
					},
				});
			}

			if (seo_image?.length) {
				await tx.category.update({
					where: { id: category.id },
					data: {
						seo_image: {
							create: {
								fileId: seo_image[0].fileId,
								url: seo_image[0].url,
							},
						},
					},
				});
			}

			// 🔤 helper for creating translations
			const createTranslation = async (
				lang: string,
				values: {
					slug?: string;
					name?: string;
					description?: string;
					seo_title?: string | null;
					seo_description?: string | null;
					seo_keywords?: string | null;
				}
			) => {
				await tx.categoryTranslation.create({
					data: {
						categoryId: category.id,
						lang,
						slug: values.slug ?? '',
						name: values.name ?? '',
						description: values.description ?? '',
						seo_title: values.seo_title ?? null,
						seo_description: values.seo_description ?? null,
						seo_keywords: values.seo_keywords ?? null,
					},
				});
			};

			// sequentially insert both langs
			await createTranslation('ar', {
				slug: slug_ar,
				name: name_ar,
				description: description_ar,
				seo_title: seo_title_ar,
				seo_description: seo_description_ar,
				seo_keywords: seo_keywords_ar,
			});
			await createTranslation('en', {
				slug: slug_en,
				name: name_en,
				description: description_en,
				seo_title: seo_title_en,
				seo_description: seo_description_en,
				seo_keywords: seo_keywords_en,
			});

			return category.id;
		},
		{ timeout: 10000 } // ✅ prevent P2028
	);

	// 🧩 fetch after transaction
	const category = await prisma_DB.category.findUnique({
		where: { id: categoryId },
		include: { translations: true, image: true, seo_image: true },
	});
	if (!category) throw new AppError('api.categories.errors.create', 404);

	revalidateTag('categories');
	// revalidatePath(`/dashboard/categories`);

	const formattedData = await formatCategory(category);
	logger.info(`✅ Category created: ${category.id}`, { context: 'CategoryService' });

	return {
		success: true,
		status: 201,
		data: formattedData,
		message: 'api.categories.success.create',
	};
}

/**
 * 🟡 update exists Category
 * Update Category (image upsert + translations upsert using categoryId_lang composite unique)
 */
export async function updateCategory(id: string, data: TTypeFormValues): Promise<ActionResult<CategoryFormatted>> {
	const validation = await ValidateFormAction(formSchema_category, data);
	if (!validation.success) {
		return {
			...validation,
			form_errors: JSON.stringify(validation.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const {
		name_ar,
		name_en,
		description_ar,
		description_en,
		slug_ar,
		slug_en,
		image,
		seo_title_ar,
		seo_title_en,
		seo_description_ar,
		seo_description_en,
		seo_keywords_ar,
		seo_keywords_en,
		seo_image,
	} = data;

	const unique = await validateUniqueSlugs(id, slug_ar, slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TTypeFormValues>;

	// 🧩 transaction: update image + translations (with timeout 10s)
	const categoryId = await prisma_DB.$transaction(
		async (tx) => {
			await tx.category.update({
				where: { id },
				data: {
					...(image?.length
						? {
								image: {
									upsert: {
										update: { fileId: image[0].fileId, url: image[0].url },
										create: { fileId: image[0].fileId, url: image[0].url },
									},
								},
						  }
						: {}),
					...(seo_image?.length
						? {
								seo_image: {
									upsert: {
										update: { fileId: seo_image[0].fileId, url: seo_image[0].url },
										create: { fileId: seo_image[0].fileId, url: seo_image[0].url },
									},
								},
						  }
						: {}),
				},
			});

			// ✅ helper: upsert translation cleanly
			const upsertTranslation = async (
				lang: string,
				values: {
					slug?: string;
					name?: string;
					description?: string;
					seo_title?: string | null;
					seo_description?: string | null;
					seo_keywords?: string | null;
				}
			) => {
				const existing = await tx.categoryTranslation.findFirst({
					where: { categoryId: id, lang },
				});

				if (existing) {
					await tx.categoryTranslation.update({
						where: { id: existing.id },
						data: values,
					});
				} else {
					await tx.categoryTranslation.create({
						data: {
							categoryId: id,
							lang,
							slug: values.slug ?? '',
							name: values.name ?? '',
							description: values.description ?? '',
							seo_title: values.seo_title ?? null,
							seo_description: values.seo_description ?? null,
							seo_keywords: values.seo_keywords ?? null,
						},
					});
				}
			};

			// ⚙️ sequential calls (avoid Promise.all)
			await upsertTranslation('ar', {
				slug: slug_ar,
				name: name_ar,
				description: description_ar,
				seo_title: seo_title_ar,
				seo_description: seo_description_ar,
				seo_keywords: seo_keywords_ar,
			});
			await upsertTranslation('en', {
				slug: slug_en,
				name: name_en,
				description: description_en,
				seo_title: seo_title_en,
				seo_description: seo_description_en,
				seo_keywords: seo_keywords_en,
			});

			return id;
		},
		{ timeout: 10000 } // ⏱️ fix P2028
	);

	// ✅ out of transaction: load data after save
	const category = await prisma_DB.category.findUnique({
		where: { id: categoryId },
		include: { translations: true, image: true, seo_image: true },
	});
	if (!category) throw new AppError('api.categories.errors.update', 404);

	revalidateTag('categories');
	// revalidatePath(`/dashboard/categories/${id}`);

	const formattedData = await formatCategory(category);
	logger.info(`✅ Category updated: ${category.id}`, { context: 'CategoryService' });

	return {
		success: true,
		status: 200,
		data: formattedData,
		message: 'api.categories.success.update',
	};
}

export async function deleteCategory(id: string) {
	console.log('delete category id:', id);
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const deleted = await prisma_DB.category.delete({ where: { id } });
	if (!deleted) throw new AppError('api.categories.errors.delete', 404);
	// revalidatePath('/dashboard/categories');
	revalidateTag('categories');
	logger.info(`✅ Category deleted: ${id}  by: ${user?.name} ${user?.id}`, {
		context: 'CategoryService',
	});
	return { success: true, status: 200, data: null, message: 'api.categories.success.delete' };
}

export async function deleteManyCategories(ids: string[]) {
	console.log('delete category ids:', ids);
	if (!ids || !Array.isArray(ids)) throw new AppError('api.errors.invalid_ids', 400);
	if (!ids.length) throw new AppError('api.errors.empty_ids', 400);

	const deleted = await prisma_DB.category.deleteMany({ where: { id: { in: ids } } });
	if (!deleted.count) throw new AppError('api.categories.errors.delete', 404);
	console.log('deleted count', deleted.count);
	// revalidatePath('/dashboard/categories');
	revalidateTag('categories');
	logger.info(`✅ Category deleted ${deleted.count} items: ${ids}  by: ${user?.name} ${user?.id}`, {
		context: 'CategoryService',
	});
	return { success: true, status: 200, data: null, message: 'api.categories.success.delete_many' };
	// return { success: true, status: 200, data: null, message: 'api.categories.success.delete_many' };
}

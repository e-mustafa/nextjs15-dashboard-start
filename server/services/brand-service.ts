import { TBrandFormValues } from '@/components/Dashboard/forms/brand-form';
import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { formSchema_brand } from '@/validation/brand-validation';
import { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

export const brandFields = ['name', 'slug', 'description'];

// get user info from cookies
let user: { id: string; name: string } | null = null;

type BrandWithRelations = Prisma.BrandGetPayload<{
	include: { translations: true; image: true };
}>;

export type BrandFormatted = Awaited<ReturnType<typeof formatBrand>>;

export type TImage = { url: string; fileId: string };

export type Brand = {
	id: string;
	name: string;
	description?: string;
	slug?: string;
	createdAt?: string;
	image?: string | TImage;
};

async function formatBrand(brand: BrandWithRelations, acceptLanguage?: string): Promise<TBrandFormValues | Brand> {
	const restData = await mapTranslations(brand.translations, {
		accept_language: acceptLanguage,
		fields: brandFields,
	});

	return {
		id: brand.id,
		image: brand?.image,
		...(restData as TBrandFormValues),
	};
}

/**
 * 🔍 يتحقق من أن slug غير مستخدم في لغة أخرى أو Brand آخر
 * 🔍 check slug unused in another lang in any brand
 */

async function validateUniqueSlugs(id: string | undefined, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
	const or: Prisma.BrandTranslationWhereInput[] = [];
	if (slug_ar) or.push({ lang: 'ar', slug: slug_ar });
	if (slug_en) or.push({ lang: 'en', slug: slug_en });
	if (or.length === 0) return { success: true, status: 200, data: null };

	const where: Prisma.BrandTranslationWhereInput = {
		OR: or,
		...(id ? { brandId: { not: id } } : {}),
	};

	const duplicate = await prisma_DB.brandTranslation.findFirst({ where });
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

export async function getAllBrands(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
): Promise<ActionResult<Brand>> {
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

	const where: Prisma.BrandWhereInput = search
		? {
				OR: [
					{ translations: { some: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
					{ translations: { some: { slug: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
					{ translations: { some: { description: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
				],
		  }
		: {};

	const [brands, total] = await Promise.all([
		prisma_DB.brand.findMany({
			where,
			skip,
			take: limit,
			include: { translations: true, image: true },
			...(orderBy ? { orderBy } : {}),
		}),
		prisma_DB.brand.count({ where }),
	]);

	if (!brands.length) throw new AppError('api.errors.not_found', 404);

	console.log('brand--', brands[0]);

	const data = (await Promise.all(brands.map((b) => formatBrand(b, locale)))) as Brand[];

	return {
		success: true,
		status: 200,
		data,
		// all_Data: brands,
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

export async function getBrand(id: string) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const brand = await prisma_DB.brand.findUnique({
		where: { id },
		include: { translations: true, image: true },
	});
	if (!brand) throw new AppError('api.brands.errors.not_found', 404);

	const data = await formatBrand(brand);
	return { success: true, status: 200, data };
}

/**
 * 🟢 create new Brand
 */
export async function createBrand(data: TBrandFormValues): Promise<ActionResult<BrandFormatted>> {
	const validation = await ValidateFormAction(formSchema_brand, data);
	if (!validation.success) {
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };
	}

	const { name_ar, name_en, description_ar, description_en, slug_ar, slug_en, image } = data;

	// unique check
	const unique = await validateUniqueSlugs(undefined, slug_ar, slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TBrandFormValues>;

	// create
	const brand = await prisma_DB.brand.create({
		data: {
			image: image?.length
				? {
						create: { fileId: image[0].fileId, url: image[0].url },
				  }
				: undefined,
			translations: {
				create: [
					{ lang: 'ar', slug: slug_ar, name: name_ar, description: description_ar ?? '' },
					{ lang: 'en', slug: slug_en, name: name_en, description: description_en ?? '' },
				],
			},
		},
		include: { translations: true, image: true },
	});

	if (!brand) throw new AppError('api.brands.errors.create', 400);

	revalidatePath('/dashboard/brands');
	const formattedData = await formatBrand(brand);
	logger.info(`✅ Brand created: ${brand.id}`, { context: 'BrandService' });

	return { success: true, status: 201, data: formattedData, message: 'api.brands.success.create' };
}
/**
 * 🟡 update exists Brand
 * Update Brand (image upsert + translations upsert using brandId_lang composite unique)
 */

export async function updateBrand(id: string, data: TBrandFormValues): Promise<ActionResult<BrandFormatted>> {
	const validation = await ValidateFormAction(formSchema_brand, data);
	if (!validation.success) {
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };
	}
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const { name_ar, name_en, description_ar, description_en, slug_ar, slug_en, image } = data;

	// check unique slugs (exclude current brand)
	const unique = await validateUniqueSlugs(id, slug_ar, slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TBrandFormValues>;

	// transaction: update brand image, then ensure translations exist/updated
	const brand = await prisma_DB.$transaction(async (tx) => {
		// update image (upsert)
		const updatedBrand = await tx.brand.update({
			where: { id },
			data: {
				image: image?.length
					? {
							upsert: {
								update: { fileId: image[0].fileId, url: image[0].url },
								create: { fileId: image[0].fileId, url: image[0].url },
							},
					  }
					: undefined,
			},
			include: { translations: true, image: true },
		});

		// For each language: try to find existing translation for this brand + lang
		// If found -> update by id. If not -> create and attach brandId.
		async function ensureTranslation(
			lang: string,
			slug: string | undefined,
			name: string | undefined,
			description?: string
		) {
			if (!slug && !name && !description) return; // nothing to do
			const existing = await tx.brandTranslation.findFirst({
				where: { brandId: id, lang },
			});
			if (existing) {
				await tx.brandTranslation.update({
					where: { id: existing.id },
					data: {
						slug: slug ?? existing.slug,
						name: name ?? existing.name,
						description: description ?? existing.description,
					},
				});
			} else {
				await tx.brandTranslation.create({
					data: { brandId: id, lang, slug: slug ?? '', name: name ?? '', description: description ?? '' },
				});
			}
		}

		await Promise.all([
			ensureTranslation('ar', slug_ar, name_ar, description_ar ?? ''),
			ensureTranslation('en', slug_en, name_en, description_en ?? ''),
		]);

		// reload translations to return
		const reloaded = await tx.brand.findUnique({
			where: { id },
			include: { translations: true, image: true },
		});
		if (!reloaded) throw new AppError('api.brands.errors.update', 404);
		return reloaded;
	});

	revalidateTag('brands');
	revalidatePath(`/dashboard/brands/${id}`);

	const formattedData = await formatBrand(brand);
	logger.info(`✅ Brand updated: ${brand.id}`, { context: 'BrandService' });

	return { success: true, status: 200, data: formattedData, message: 'api.brands.success.update' };
}

export async function deleteBrand(id: string) {
	console.log('delete brand id:', id);
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const deleted = await prisma_DB.brand.delete({ where: { id } });
	if (!deleted) throw new AppError('api.brands.errors.delete', 404);
	// revalidatePath('/dashboard/brands');
	revalidateTag('brands');
	logger.info(`✅ Brand deleted: ${id}  by: ${user?.name} ${user?.id}`, {
		context: 'BrandService',
	});
	return { success: true, status: 200, data: null, message: 'api.brands.success.delete' };
}

export async function deleteManyBrands(ids: string[]) {
	console.log('delete brand ids:', ids);
	if (!ids || !Array.isArray(ids)) throw new AppError('api.errors.invalid_ids', 400);
	if (!ids.length) throw new AppError('api.errors.empty_ids', 400);

	const deleted = await prisma_DB.brand.deleteMany({ where: { id: { in: ids } } });
	if (!deleted.count) throw new AppError('api.brands.errors.delete', 404);
	console.log('deleted count', deleted.count);
	// revalidatePath('/dashboard/brands');
	revalidateTag('brands');
	logger.info(`✅ Brand deleted ${deleted.count} items: ${ids}  by: ${user?.name} ${user?.id}`, {
		context: 'BrandService',
	});
	return { success: true, status: 200, data: null, message: 'api.brands.success.delete_many' };
	// return { success: true, status: 200, data: null, message: 'api.brands.success.delete_many' };
}

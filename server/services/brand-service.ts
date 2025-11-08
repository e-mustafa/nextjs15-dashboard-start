'use server';
import { localesData, TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult, TImage } from '@/types/api';
import { fields, formSchemaBrand, TBrandFormValues } from '@/validation/brand-validation';
import { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

type TFormValues = TBrandFormValues;

let user: { id: string; name: string } | null = null;

type BrandWithRelations = Prisma.BrandGetPayload<{
	include: { translations: true; images: { include: { image: true } }; seoImage: true };
}>;

export type Brand = {
	id: string;
	name: string;
	description?: string;
	slug?: string;
	isActive: boolean;
	seoTitle?: string;
	seoDescription?: string;
	seoKeywords?: string;
	createdAt?: string;
	updatedAt?: string;
	images?: TImage[];
	seoImage?: TImage;
};

async function formatBrand(brand: BrandWithRelations, acceptLanguage?: string): Promise<TFormValues | Brand> {
	const { translations, images, seoImage, imageId, seoImageId, ...rest } = brand;

	const translationData = await mapTranslations(translations, {
		accept_language: acceptLanguage,
		fields,
	});

	return {
		...rest,
		images:
			images?.map((img) => ({
				url: img.image?.url ?? '',
				fileId: img.image?.fileId ?? '',
			})) ?? [],

		seoImage: seoImage ? [{ url: seoImage?.url, fileId: seoImage?.fileId }] : [],

		...(translationData as TFormValues),
	};
}

async function validateUniqueSlugs(id?: string, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
	const or: Prisma.BrandTranslationWhereInput[] = [];
	if (slug_ar) or.push({ lang: 'ar', slug: slug_ar });
	if (slug_en) or.push({ lang: 'en', slug: slug_en });
	if (!or.length) return { success: true, status: 200, data: null };

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

/** 🔹 Get All Brands */
export async function getAllBrands(
	params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
	locale?: TLocalesData
): Promise<ActionResult<Brand>> {
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

	const sortableFields = ['name', 'slug', 'createdAt'];
	const sortBy = sortableFields.includes(params?.sortBy || '') ? params?.sortBy : undefined;
	const sortOrder = params?.sortOrder === 'desc' ? 'desc' : 'asc';
	const localeKey = locale?.split('-')[0] || 'en';

	const orderBy = sortBy ? { [`${sortBy}_${localeKey}`]: sortOrder } : undefined;

	const where: Prisma.BrandWhereInput = search
		? {
				OR: [
					{ translations: { some: { name: { contains: search, mode: 'insensitive' } } } },
					{ translations: { some: { slug: { contains: search, mode: 'insensitive' } } } },
					{ translations: { some: { description: { contains: search, mode: 'insensitive' } } } },
				],
		  }
		: {};

	const [brands, total] = await Promise.all([
		prisma_DB.brand.findMany({
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
		prisma_DB.brand.count({ where }),
	]);

	// if (!brands.length) throw new AppError('api.errors.not_found', 404);

	const data = await Promise.all(brands.map((brand) => formatBrand(brand, locale)));
	return {
		success: true,
		status: 200,
		data: data as Brand[],
		meta: {
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
			sort: sortBy ? { by: sortBy, order: sortOrder } : undefined,
		},
	};
}

/** 🔹 Get Brand By ID */
export async function getBrand(id: string) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const brand = await prisma_DB.brand.findUnique({
		where: { id },
		include: { translations: true, images: { include: { image: true }, orderBy: { sortOrder: 'asc' } }, seoImage: true },
	});

	if (!brand) throw new AppError('api.brands.errors.not_found', 404);

	const data = await formatBrand(brand);
	return { success: true, status: 200, data };
}

/** 🟢 Create Brand */
export async function createBrand(data: TFormValues): Promise<ActionResult<TFormValues>> {
	const validation = await ValidateFormAction(formSchemaBrand, data);
	if (!validation.success)
		return { ...validation, form_errors: JSON.stringify(validation.form_errors), error: 'api.errors.inputs_validation' };

	const unique = await validateUniqueSlugs(undefined, data.slug_ar, data.slug_en);
	if (!unique.success) return unique as unknown as ActionResult<TFormValues>;

	// 🔹 handel seo image
	const existingSeoImage = data.seoImage?.length
		? await prisma_DB.image.findFirst({ where: { fileId: data.seoImage[0].fileId } })
		: null;

	const brand = await prisma_DB.brand.create({
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

	revalidatePath('/dashboard/brands');
	const formattedData = await formatBrand(brand as BrandWithRelations);
	logger.info(`✅ Brand created: ${brand.id}`, { context: 'BrandService' });

	return { success: true, status: 201, data: formattedData as TFormValues, message: 'api.brands.success.create' };
}

/** 🟡 Update Brand */
export async function updateBrand(id: string, data: TFormValues): Promise<ActionResult<TFormValues>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const validation = await ValidateFormAction(formSchemaBrand, data);
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
		await tx.brand.update({
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

		// 🔹 update translations
		const langs = Object.keys(localesData) as TLocalesData[];
		for (const lang of langs) {
			const slug = data[`slug_${lang}`];
			const name = data[`name_${lang}`];
			const description = data[`description_${lang}`];
			const seoTitle = data[`seoTitle_${lang}`];
			const seoDescription = data[`seoDescription_${lang}`];
			const seoKeywords = data[`seoKeywords_${lang}`];

			const existing = await tx.brandTranslation.findFirst({ where: { brandId: id, lang } });
			if (existing) {
				await tx.brandTranslation.update({
					where: { id: existing.id },
					data: { slug, name, description, seoTitle, seoDescription, seoKeywords },
				});
			} else {
				await tx.brandTranslation.create({
					data: { brandId: id, lang, slug, name, description, seoTitle, seoDescription, seoKeywords },
				});
			}
		}
	});

	// 🔄 get updated data after update
	const brand = await prisma_DB.brand.findUnique({
		where: { id },
		include: { translations: true, images: { include: { image: true }, orderBy: { sortOrder: 'asc' } }, seoImage: true },
	});

	if (!brand) throw new AppError('api.brands.errors.not_found', 404);

	revalidateTag('brands', 'max');
	// updateTag('brands');

	const formattedData = await formatBrand(brand as BrandWithRelations);
	logger.info(`✅ Brand updated: ${brand.id}`, { context: 'BrandService' });
	return { success: true, status: 200, data: formattedData as TFormValues, message: 'api.brands.success.update' };
}

/** 🟡 Toggle State Brand */
export async function toggleStateBrand(id: string, isActive: boolean) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const updated = await prisma_DB.brand.update({
		where: { id },
		data: { isActive },
		select: { id: true, isActive: true },
	});

	if (!updated) throw new AppError('api.errors.update_status', 404);

	revalidateTag('brands', 'max');
	// updateTag('brands');
	logger.info(`✅ Brand updated: ${updated.id}`, { context: 'BrandService' });
	return { success: true, status: 200, data: updated, message: 'api.success.update_status' };
}

/** 🔴 Delete Brand */
export async function deleteBrand(id: string) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	await prisma_DB.brand.delete({ where: { id } });
	revalidateTag('brands', 'max');
	// updateTag('brands');
	logger.info(`✅ Brand deleted: ${id} by ${user?.name}`, { context: 'BrandService' });

	return { success: true, status: 200, data: null, message: 'api.brands.success.delete' };
}

export async function deleteManyBrands(ids: string[]) {
	if (!ids?.length) throw new AppError('api.errors.empty_ids', 400);

	const deleted = await prisma_DB.brand.deleteMany({ where: { id: { in: ids } } });
	if (!deleted.count) throw new AppError('api.brands.errors.delete', 404);

	revalidateTag('brands', 'max');
	// updateTag('brands');
	logger.info(`✅ ${deleted.count} brands deleted by ${user?.name}`, { context: 'BrandService' });
	return { success: true, status: 200, data: null, message: 'api.brands.success.delete_many' };
}

import { TBrandFormValues } from '@/components/Dashboard/forms/brand-form';
import { AppError, Result } from '@/lib/server/error-handler/errorsApp';
import { mapTranslations } from '@/lib/server/mapTranslations.server';
import { ValidateFormAction } from '@/lib/server/validate-data-server';
import { prisma_DB } from '@/server/db/prisma';
import { formSchema_brand } from '@/validation/brand-validation';
import { revalidatePath } from 'next/cache';
import { Prisma } from '../generated/prisma';

export const brandFields = ['name', 'slug', 'description'];

type BrandWithRelations = Prisma.BrandGetPayload<{
	include: { translations: true; image: true };
}>;

export type BrandFormatted = Awaited<ReturnType<typeof formatBrand>>;

async function formatBrand(brand: BrandWithRelations, acceptLanguage?: string): Promise<TBrandFormValues> {
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
export async function getAllBrands() {
	const brands = await prisma_DB.brand.findMany({
		include: { translations: true, image: true },
	});
	if (!brands) throw new AppError('api.errors.not_found', 404);

	const data = await Promise.all(brands.map((brand) => formatBrand(brand)));
	return { success: true, status: 200, data };
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

export async function createBrand(data: TBrandFormValues): Promise<Result<BrandFormatted>> {
	const result = await ValidateFormAction<TBrandFormValues>(formSchema_brand, data);

	if (!result.success) {
		return {
			...result,
			form_errors: JSON.stringify(result.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	const { name_ar, name_en, description_ar, description_en, slug_ar, slug_en, image } = data;

	const exists = await prisma_DB.brandTranslation.findFirst({
		where: {
			OR: [
				{ lang: 'ar', slug: slug_ar },
				{ lang: 'en', slug: slug_en },
			],
		},
	});

	if (exists) {
		const form_errors = {
			slug_ar: ['api.errors.slug_exists'],
			slug_en: ['api.errors.slug_exists'],
		};

		// throw new AppError('api.errors.slug_exists', 400);
		return {
			success: false,
			status: 400,
			form_errors: JSON.stringify(form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	const brand = await prisma_DB.brand.create({
		data: {
			image: image.length
				? {
						create: {
							fileId: image[0].fileId,
							url: image[0].url,
						},
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
	return { success: true, status: 201, data: formattedData, message: 'api.brands.success.create' };
}

// export async function updateBrand<T>(id: string, data: TBrandFormValues) {
export async function updateBrand(id: string, data: TBrandFormValues): Promise<Result<BrandFormatted>> {
	const result = await ValidateFormAction<TBrandFormValues>(formSchema_brand, data);

	if (!result.success) {
		return {
			...result,
			form_errors: JSON.stringify(result.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const { name_ar, name_en, description_ar, description_en, slug_ar, slug_en, image } = data;

	const brand = await prisma_DB.brand.update({
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
			translations: {
				upsert: [
					{
						where: { lang_slug: { lang: 'ar', slug: slug_ar } },
						update: { name: name_ar, description: description_ar ?? '', slug: slug_ar },
						create: { lang: 'ar', slug: slug_ar, name: name_ar, description: description_ar ?? '' },
					},
					{
						where: { lang_slug: { lang: 'en', slug: slug_en } },
						update: { name: name_en, description: description_en ?? '', slug: slug_en },
						create: { lang: 'en', slug: slug_en, name: name_en, description: description_en ?? '' },
					},
				],
			},
		},
		include: { translations: true, image: true },
	});

	if (!brand) throw new AppError('api.brands.errors.update', 404);

	// revalidateTag('brands');
	revalidatePath('/dashboard/brands');
	revalidatePath(`/dashboard/brands/${id}`);

	const formattedData = await formatBrand(brand);
	return { success: true, status: 200, data: formattedData, message: 'api.brands.success.update' };
}

export async function deleteBrand(id: string) {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const deleted = await prisma_DB.brand.delete({ where: { id } });
	if (!deleted) throw new AppError('api.brands.errors.delete', 404);
	revalidatePath('/dashboard/brands');
	return { success: true, status: 200, data: null, message: 'api.brands.success.delete' };
}

export async function deleteManyBrands(ids: string[]) {
	if (!ids || !Array.isArray(ids)) throw new AppError('api.errors.invalid_ids', 400);

	const deleted = await prisma_DB.brand.deleteMany({ where: { id: { in: ids } } });
	if (!deleted.count) throw new AppError('api.brands.errors.delete', 404);
	revalidatePath('/dashboard/brands');
	return { success: true, status: 200, data: null, message: 'api.brands.success.delete_many' };
}

// app/brand/actions.ts
'use server';

import { TBrandFormValues } from '@/components/Dashboard/forms/brand-form';
import { isDEV } from '@/configs/general';
import { ValidateFormAction } from '@/lib/utils';
import { formSchema_brand } from '@/validation/brand-validation';
import { prisma_DB } from '../db/prisma';

// import { formSchema_brand, TBrandFormValues } from '@/lib/forms/brand';

export async function saveBrandAction(formData: unknown, id?: string) {
	const result = await ValidateFormAction<TBrandFormValues>(formSchema_brand, formData);

	if (!result.success) {
		return {
			...result,
			error: JSON.stringify(result.error),
		};
	}

	const { name_ar, name_en, description_ar, description_en, slug_ar, slug_en, image } = result.data;

	try {
		// ✅ check uniqueness
		const existing = await prisma_DB.brand.findFirst({
			where: {
				translations: {
					some: {
						OR: [
							{ lang: 'ar', slug: slug_ar },
							{ lang: 'en', slug: slug_en },
						],
					},
				},
			},
			include: { translations: true },
		});

		if (existing && existing.id !== id) {
			return { success: false, error: 'api.brands.error.exists' };
		}

		let brand;
		if (id) {
			// ✅ update
			brand = await prisma_DB.brand.update({
				where: { id },
				data: {
					image: image || '',
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
				include: { translations: true },
			});
		} else {
			// ✅ create
			brand = await prisma_DB.brand.create({
				data: {
					image: image || '',
					translations: {
						create: [
							{ lang: 'ar', slug: slug_ar, name: name_ar, description: description_ar ?? '' },
							{ lang: 'en', slug: slug_en, name: name_en, description: description_en ?? '' },
						],
					},
				},
				include: { translations: true },
			});
		}

		return {
			success: true,
			status: id ? 200 : 201,
			data: brand,
			message: id ? 'api.brands.success.update' : 'api.brands.success.create',
		};
	} catch (err) {
		isDEV && console.error(err);
		return { success: false, error: 'api.brands.error.create' };
	}
}

export async function deleteBrandAction(id: string) {
	try {
		await prisma_DB.brand.delete({ where: { id } });
		return { success: true, status: 200, data: null };
	} catch (err) {
		isDEV && console.error(err);
		return { success: false, error: 'api.brands.error.delete' };
	}
}

// delete many brands
export async function deleteBrandsAction(ids: string[]) {
	try {
		await prisma_DB.brand.deleteMany({ where: { id: { in: ids } } });
		return { success: true, status: 200, message: 'api.brands.success.delete', data: null };
	} catch (err) {
		isDEV && console.error(err);
		return { success: false, error: 'api.brands.error.delete' };
	}
}

export async function getBrandsAction() {
	try {
		const brands = await prisma_DB.brand.findMany({ include: { translations: true } });

		if (!brands) {
			return { success: false, error: 'api.brands.error.exists' };
		}

		return { success: true, status: 200, data: brands };
	} catch (err) {
		isDEV && console.error(err);
		return { success: false, error: 'DB error while getting brands' };
	}
}

export async function getBrandAction(id: string) {
	try {
		const brand = await prisma_DB.brand.findUnique({ where: { id }, include: { translations: true } });
		if (!brand) {
			return { success: false, error: 'api.brands.error.exists' };
		}
		return { success: true, status: 200, data: brand };
	} catch (err) {
		isDEV && console.error(err);
		return { success: false, error: 'DB error while getting brand' };
	}
}

// export async function getBrandBySlugAction(slug: string) {
// 	try {
// 		const brand = await prisma_DB.brand.findUnique({ where: { slug }, include: { translations: true } });
// 		if (!brand) {
// 			return { success: false, error: 'api.brands.error.exists' };
// 		}
// 		return { success: true, status: 200, data: brand };
// 	} catch (err) {
// 		isDEV && console.error(err);
// 		return { success: false, error: 'DB error while getting brand' };
// 	}
// }

// export async function getBrandsBySlugAction(slugs: string[]) {
// 	try {
// 		const brands = await prisma_DB.brand.findMany({ where: { slug: { in: slugs } }, include: { translations: true } });
// 		if (!brands) {
// 			return { success: false, error: 'api.brands.error.exists' };
// 		}
// 		return { success: true, status: 200, data: brands };
// 	} catch (err) {
// 		isDEV && console.error(err);
// 		return { success: false, error: 'DB error while getting brands' };
// 	}
// }

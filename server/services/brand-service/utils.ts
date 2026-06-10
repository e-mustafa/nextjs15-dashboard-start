import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { fields } from '@/validation/brand-validation';
import { Prisma } from '@prisma/client';
import { Brand, BrandProduct, BrandWithRelations, TFormValues } from './types';

export const BRAND_COMPLETE_INCLUDE = {
	translations: true,
	images: { include: { image: true }, orderBy: { sortOrder: 'asc' } },
	seoImage: true,
	products: {
		select: {
			id: true,
			translations: { select: { lang: true, name: true } },
			images: {
				include: { image: true },
				orderBy: { sortOrder: 'asc' },
				take: 1,
			},
		},
	},
} as const;

export async function formatBrandProduct(
	productRelation: BrandWithRelations['products'][0],
	locale?: string,
): Promise<BrandProduct> {
	const { id, translations, images } = productRelation;

	let productName = '';
	if (translations?.length > 0) {
		const productTranslation = await mapTranslations(translations, {
			accept_language: locale,
			fields: ['name'],
			enableFallback: true,
		});
		productName = productTranslation.name || '';
	}

	const firstImage = images?.[0]?.image?.url || undefined;

	return {
		id,
		name: productName,
		image: firstImage,
	};
}

export async function formatBrand(
	brand: BrandWithRelations,
	acceptLanguage?: string,
	forEdit: boolean = false,
): Promise<TFormValues | Brand> {
	const { translations, products, images, seoImage, imageId, seoImageId, ...rest } = brand;

	const translationData = await mapTranslations(translations, {
		accept_language: forEdit ? '*' : acceptLanguage,
		fields,
	});

	let formattedProducts: BrandProduct[] = [];
	if (forEdit && products) {
		formattedProducts = await Promise.all(products.map((p) => formatBrandProduct(p, acceptLanguage)));
	}

	return {
		...rest,
		images:
			images?.map((img) => ({
				url: img.image?.url ?? '',
				fileId: img.image?.fileId ?? '',
			})) ?? [],

		seoImage: seoImage ? [{ url: seoImage?.url, fileId: seoImage?.fileId }] : [],

		...(translationData as TFormValues),

		products: products?.map((p) => p.id) || [],

		...(forEdit && {
			initialItems: {
				products: formattedProducts || [],
			},
		}),
	};
}

export async function validateUniqueSlugs(id?: string, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
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

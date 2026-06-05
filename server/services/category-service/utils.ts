import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { fields } from '@/validation/category-validation';
import { Prisma } from '@prisma/client';
import { Category, CategoryProduct, CategoryWithRelations, TFormValues } from './types';

export const CATEGORY_COMPLETE_INCLUDE = {
	translations: true,
	images: {
		include: { image: true },
		orderBy: { sortOrder: 'asc' },
	},
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

/** 🔹 Format Single Product for Category */
export async function formatCategoryProduct(
	productRelation: CategoryWithRelations['products'][0],
	locale?: string,
): Promise<CategoryProduct> {
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

export async function formatCategory(
	category: CategoryWithRelations,
	acceptLanguage?: string,
	forEdit: boolean = false,
): Promise<TFormValues | Category> {
	const { translations, products, images, seoImage, imageId, seoImageId, ...rest } = category;

	const translationData = await mapTranslations(translations, {
		accept_language: forEdit ? '*' : acceptLanguage,
		fields,
	});

	let formattedProducts: CategoryProduct[] = [];
	if (forEdit && products) {
		formattedProducts = await Promise.all(products.map((p) => formatCategoryProduct(p, acceptLanguage)));
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
				products: formattedProducts,
			},
		}),
	};
}

export async function validateUniqueSlugs(id?: string, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
	const or: Prisma.CategoryTranslationWhereInput[] = [];
	if (slug_ar) or.push({ lang: 'ar', slug: slug_ar });
	if (slug_en) or.push({ lang: 'en', slug: slug_en });
	if (!or.length) return { success: true, status: 200, data: null };

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

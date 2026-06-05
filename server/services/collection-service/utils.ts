import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { fields } from '@/validation/category-validation';
import { Prisma } from '@prisma/client';
import { Collection, CollectionProduct, CollectionWithRelations, TFormValues } from './types';

export const COLLECTION_COMPLETE_INCLUDE = {
	translations: true,
	images: {
		include: { image: true },
		orderBy: { sortOrder: 'asc' },
	},
	seoImage: true,
	products: {
		select: {
			sortOrder: true,
			product: {
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
		},
	},
} as const;

export async function formatCollectionProduct(
	productRelation: CollectionWithRelations['products'][0],
	locale?: string,
): Promise<CollectionProduct> {
	const {
		product: { id, translations, images },
	} = productRelation;

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

export async function formatCollection(
	collection: CollectionWithRelations,
	acceptLanguage?: string,
	forEdit: boolean = false,
): Promise<TFormValues | Collection> {
	const { translations, products, images, seoImage, ...rest } = collection;
	console.log('products--', products);

	const translationData = await mapTranslations(translations, {
		accept_language: forEdit ? '*' : acceptLanguage,
		fields,
	});

	let formattedProducts: CollectionProduct[] = [];

	if (forEdit) {
		formattedProducts = await Promise.all(products?.map((p) => formatCollectionProduct(p, acceptLanguage)));
	}

	return {
		...rest,
		images: images?.map((img) => ({
			url: img.image?.url ?? '',
			fileId: img.image?.fileId ?? '',
		})),
		seoImage: seoImage ? [{ url: seoImage?.url, fileId: seoImage?.fileId }] : [],

		...(translationData as TFormValues),

		products: products?.map((p) => p.product.id) || [],

		...(forEdit && {
			initialItems: { products: formattedProducts },
		}),
	};
}

export async function validateUniqueSlugs(id?: string, slug_ar?: string, slug_en?: string): Promise<ActionResult<null>> {
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

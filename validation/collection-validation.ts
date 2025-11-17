import z from 'zod';
import { imagesField, nameArField, nameEnField } from './fields-validation';
import { SEODefaultValues, SEOFormSchema } from './seo-validation';

export type TCollectionFormValues = z.infer<typeof formSchemaCollection> & { id?: string };

/** ✅ Unified fields using camelCase naming */
export const fields = ['name', 'description', 'slug', 'seoTitle', 'seoDescription', 'seoKeywords'];

export const defaultValuesCollection = {
	name_ar: '',
	name_en: '',
	description_ar: '',
	description_en: '',
	isActive: true,
	isFeatured: false,
	images: [],

	...SEODefaultValues,
};

export const formSchemaCollection = z
	.object({
		name_ar: nameArField,
		name_en: nameEnField,
		description_ar: z.string().optional(),
		description_en: z.string().optional(),

		isActive: z.boolean(),
		isFeatured: z.boolean(),

		images: imagesField.optional(),

		products: z.array(z.string()).optional(),
	})
	.extend(SEOFormSchema.shape);

import z from 'zod';
import { imagesField, nameArField, nameEnField } from './fields-validation';
import { SEODefaultValues, seoFields, SEOFormSchema } from './seo-validation';

export type TCategoryFormValues = z.infer<typeof formSchemaCategory> & { id?: string };

export const fields = ['name', 'description', ...seoFields];

export const defaultValuesCategory = {
	name_ar: '',
	name_en: '',
	description_ar: '',
	description_en: '',
	isActive: true,
	images: [],

	...SEODefaultValues,
};

export const formSchemaCategory = z
	.object({
		name_ar: nameArField,
		name_en: nameEnField,
		description_ar: z.string().optional(),
		description_en: z.string().optional(),

		isActive: z.boolean(),

		images: imagesField.optional(),

		products: z.array(z.string()).optional(),
	})
	.extend(SEOFormSchema.shape);

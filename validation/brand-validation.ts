import { msg } from '@/lib/utils';
import z from 'zod';
import { imagesField, nameArField, nameEnField } from './fields-validation';
import { SEODefaultValues, SEOFormSchema } from './seo-validation';

export type TBrandFormValues = z.infer<typeof formSchemaBrand> & { id?: string };

/** ✅ Unified fields using camelCase naming */
export const fields = ['name', 'description', 'slug', 'seoTitle', 'seoDescription', 'seoKeywords'];

export const defaultValuesBrand = {
	name_ar: '',
	name_en: '',
	description_ar: '',
	description_en: '',
	images: [],

	...SEODefaultValues,
};

export const formSchemaBrand = z
	.object({
		name_ar: nameArField,
		name_en: nameEnField,
		description_ar: z.string().optional(),
		description_en: z.string().optional(),

		isActive: z.boolean(),

		images: imagesField,
		products: z.array(z.string()).optional(),
	})
	.extend(SEOFormSchema.shape);
// .merge(SEOFormSchema);

// export const formSchema_brand2 = z.object({
// 	name_ar: z
// 		.string()
// 		.trim()
// 		.min(2, { message: msg('forms.validation.name_ar_min', { min: 2 }) })
// 		.max(30, { message: msg('forms.validation.name_ar_max', { min: 30 }) }),
// 	name_en: z
// 		.string()
// 		.trim()
// 		.min(2, { message: msg('forms.validation.name_ar_min', { min: 2 }) })
// 		.max(30, { message: msg('forms.validation.name_ar_max', { min: 30 }) }),
// 	description_ar: z
// 		.string()
// 		.min(5, { message: msg('forms.validation.name_ar_min', { min: 5 }) })
// 		.max(150, { message: msg('forms.validation.name_ar_max', { min: 150 }) }),
// 	description_en: z
// 		.string()
// 		.min(5, { message: msg('forms.validation.name_ar_min', { min: 5 }) })
// 		.max(150, { message: msg('forms.validation.name_ar_max', { min: 150 }) }),
// 	slug_ar: slugSchema('ar'),
// 	slug_en: slugSchema('en'),
// 	image: z.url(),
// });

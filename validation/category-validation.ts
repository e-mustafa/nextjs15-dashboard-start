import { msg } from '@/lib/utils';
import z from 'zod';
import { SEODefaultValues, seoFields, SEOFormSchema } from './seo-validation';

export const fields = ['name', 'description', ...seoFields];

export const defaultValues_category = {
	name_ar: '',
	name_en: '',
	description_ar: '',
	description_en: '',
	image: '',

	...SEODefaultValues,
};

export const formSchema_category = z
	.object({
		name_ar: z
			.string()
			.trim()
			.min(2, { message: msg('forms.validation.name_ar_min', { min: 2 }) })
			.max(30, { message: msg('forms.validation.name_ar_max', { min: 30 }) }),
		name_en: z
			.string()
			.trim()
			.min(2, { message: msg('forms.validation.name_ar_min', { min: 2 }) })
			.max(30, { message: msg('forms.validation.name_ar_max', { min: 30 }) }),
		description_ar: z.string().optional(),
		description_en: z.string().optional(),
		image: z.any().optional(),
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

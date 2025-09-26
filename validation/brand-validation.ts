import { msg } from '@/lib/utils';
import z from 'zod';
import { slugSchema } from './fields-validation';

export const defaultValues_brand = {
	name_ar: '',
	name_en: '',
	description_ar: '',
	description_en: '',
	image: 'https://picsum.photos/200/300?random=2',

	slug_ar: '',
	slug_en: '',

	// ...SEODefaultValues,
};

export const formSchema_brand = z.object({
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
	slug_ar: slugSchema('ar'),
	slug_en: slugSchema('en'),
	image: z.string().url().optional(),
});
// .merge(SEOFormSchema);

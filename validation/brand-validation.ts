import { msg } from '@/lib/utils';
import z from 'zod';

export const defaultValues_brand = {
	name_ar: '',
	name_en: '',
	description_ar: '',
	description_en: '',
	image: 'https://picsum.photos/200/300?random=2',

	// ...SEODefaultValues,
};

export const formSchema_brand = z.object({
	name_ar: z
		.string()
		.min(2, { message: msg('forms.validation.name_ar_min', { min: 2 }) })
		.max(30, { message: msg('forms.validation.name_ar_max', { min: 30 }) }),
	name_en: z
		.string()
		.min(2, { message: msg('forms.validation.name_ar_min', { min: 2 }) })
		.max(30, { message: msg('forms.validation.name_ar_max', { min: 30 }) }),
	description_ar: z
		.string()
		.min(2, { message: msg('forms.validation.description_ar_min', { min: 2 }) })
		.max(250, { message: msg('forms.validation.description_ar_max', { min: 250 }) }),
	description_en: z
		.string()
		.min(2, { message: msg('forms.validation.description_ar_min', { min: 2 }) })
		.max(250, { message: msg('forms.validation.description_ar_max', { min: 250 }) }),
	image: z.string().url().optional(),
});
// .merge(SEOFormSchema);

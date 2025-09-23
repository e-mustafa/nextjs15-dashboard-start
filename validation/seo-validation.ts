import { msg } from '@/lib/utils';
import z from 'zod';

export const SEODefaultValues = {
	seo_name_ar: '',
	seo_name_en: '',
	seo_description_ar: '',
	seo_description_en: '',
	seo_keywords: '',
	seo_image: '',

	slug_ar: '',
	slug_en: '',
};

export const validate_slug = z
	.string()
	.min(2, { message: msg('forms.validation.slug_min', { min: 2 }) })
	.max(100, { message: msg('forms.validation.slug_max', { max: 100 }) })
	.regex(/^[\p{L}0-9-]+$/u, { message: msg('forms.validation.slug_regex') });

export const SEOFormSchema = z.object({
	seo_name_ar: z.string().optional(),
	seo_name_en: z.string().optional(),
	seo_description_ar: z.string().optional(),
	seo_description_en: z.string().optional(),
	// seo_link: z.url('forms.validation.invalid_url').optional(),
	Seo_keywords: z.string().optional(),

	seo_image: z.string().url().optional(),

	slug_ar: validate_slug,
	slug_en: validate_slug,
});

export type SEOFormValues = z.infer<typeof SEOFormSchema>;

export type SEOFormErrors = z.infer<typeof SEOFormSchema>;

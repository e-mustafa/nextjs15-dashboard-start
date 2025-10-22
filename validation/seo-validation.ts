import { msg } from '@/lib/utils';
import z from 'zod';
import { slugSchema } from './fields-validation';

export const seoFields = ['seo_title', 'seo_description', 'slug'];

export const SEODefaultValues = {
	seo_title_ar: '',
	seo_title_en: '',
	seo_description_ar: '',
	seo_description_en: '',
	slug_ar: '',
	slug_en: '',
	seo_keywords: '',
	seo_image: '',
};

export const validate_slug = z
	.string()
	.min(2, { message: msg('forms.validation.slug_min', { min: 2 }) })
	.max(100, { message: msg('forms.validation.slug_max', { max: 100 }) })
	.regex(/^[\p{L}0-9-]+$/u, { message: msg('forms.validation.slug_regex') });

export const SEOFormSchema = z.object({
	seo_title_ar: z.string().optional(),
	seo_title_en: z.string().optional(),
	seo_description_ar: z.string().optional(),
	seo_description_en: z.string().optional(),
	// seo_link: z.url('forms.validation.invalid_url').optional(),
	slug_ar: slugSchema('ar'),
	slug_en: slugSchema('en'),
	seo_keywords_ar: z.string().optional(),
	seo_keywords_en: z.string().optional(),

	seo_image: z.any().optional(),
});

export type SEOFormValues = z.infer<typeof SEOFormSchema>;

// export type SEOFormErrors = z.infer<typeof SEOFormSchema>;

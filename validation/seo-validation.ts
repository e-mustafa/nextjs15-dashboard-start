import z from 'zod';
import { imagesField, slugSchema } from './fields-validation';

export type SEOFormValues = z.infer<typeof SEOFormSchema>;

/** ✅ SEO fields with consistent camelCase naming */
export const seoFields = ['seoTitle', 'seoDescription', 'slug', 'seoKeywords'];

export const SEODefaultValues = {
	seoTitleAr: '',
	seoTitleEn: '',
	seoDescriptionAr: '',
	seoDescriptionEn: '',
	slugAr: '',
	slugEn: '',
	seoKeywords_Ar: '',
	seoKeywords_en: '',
	seoImage: '',
};

// export const validateSlug = z
// 	.string()
// 	.min(2, { message: msg('forms.validation.slug_min', { min: 2 }) })
// 	.max(100, { message: msg('forms.validation.slug_max', { max: 100 }) })
// 	.regex(/^[\p{L}0-9-]+$/u, { message: msg('forms.validation.slug_regex') });

export const SEOFormSchema = z.object({
	seoTitle_ar: z.string().optional(),
	seoTitle_en: z.string().optional(),
	seoDescription_ar: z.string().optional(),
	seoDescription_en: z.string().optional(),
	slug_ar: slugSchema('ar'),
	slug_en: slugSchema('en'),
	seoKeywords_ar: z.string().optional(),
	seoKeywords_en: z.string().optional(),
	// seoImage: z.object({ url: z.string(), fileId: z.string() }).optional(),
	seoImage: imagesField,
});

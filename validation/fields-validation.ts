import { TLocalesData } from '@/configs/general';
import { msg } from '@/lib/utils';
import z from 'zod';

export const preprocessNumber = (ctx: z.ZodNumber) =>
	z.preprocess((val) => {
		if (val === '' || val === null || val === undefined) return 0;
		if (typeof val === 'number') return val;
		if (typeof val === 'string') {
			const n = val.trim() === '' ? NaN : Number(val);
			return Number.isNaN(n) ? val : n;
		}
		return val;
	}, ctx) as unknown as z.ZodNumber;

export const intNotNegativeField = preprocessNumber(
	z.int({ message: msg('forms.validation.integer') }).nonnegative({ message: msg('forms.validation.price_nonnegative') })
);

// slug ----------------------------------------------
const regExp_slugAr = /^[\u0600-\u06FFA-Za-z0-9-]+$/; // allow arabic, latin characters and numbers
const regExp_slugEn = /^[A-Za-z0-9-]+$/; // allow latin characters and numbers

export const slugSchema = (locale: TLocalesData = 'ar') =>
	z
		.string()
		.trim()
		.min(1, 'forms.validation.slug_required')
		.max(255, msg('forms.validation.slug_max', { max: 255 }))
		.refine(
			(val) => {
				if (locale === 'ar') {
					return regExp_slugAr.test(val);
				}
				return regExp_slugEn.test(val);
			},
			{
				message: locale === 'ar' ? 'forms.validation.slug_ar_regex' : 'forms.validation.slug_en_regex',
			}
		);

// fields validation --------------------------------------------------------
export const emailField = z
	.string()
	.trim()
	.nonempty({ message: 'validation.email_required' })
	.email({ message: 'validation.invalid_email' });

export const passwordField = z
	.string()
	.nonempty({ message: 'validation.password_required' })
	.min(8, { message: msg('validation.min', { field_name: 'inputs.password_label', min: 8 }) })
	.max(32, { message: msg('validation.max', { field_name: 'inputs.password_label', max: 32 }) });

export const nameField = z.string().nonempty({ message: 'validation.name_required' });

export const otpField = z
	.string()
	.nonempty({ message: 'validation.otp_required' })
	.min(4, { message: 'validation.otp_required' });

export const imagesField = z.array(
	z.object({
		url: z.url({ message: msg('forms.validation.invalid_url') }),
		fileId: z.string(),
	})
);
// .optional();

export const nameArField = z
	.string()
	.trim()
	.min(2, { message: msg('forms.validation.name_ar_min', { min: 2 }) })
	.max(30, { message: msg('forms.validation.name_ar_max', { min: 30 }) });

export const nameEnField = z
	.string()
	.trim()
	.min(2, { message: msg('forms.validation.name_en_min', { min: 2 }) })
	.max(30, { message: msg('forms.validation.name_en_max', { min: 30 }) });

export const shortDescription = z
	.string({ message: 'forms.validation.short_description_required' })
	.trim()
	.min(20, { message: msg('forms.validation.short_description_min', { min: 20 }) })
	.max(500, { message: msg('forms.validation.short_description_max', { max: 500 }) });

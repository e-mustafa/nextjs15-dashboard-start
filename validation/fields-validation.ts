import { TLocalesData } from '@/configs/general';
import { msg } from '@/lib/utils';
import z from 'zod';

// slug ----------------------------------------------
const regExp_slugAr = /^[\u0600-\u06FFA-Za-z0-9-]+$/; // allow arabic, latin characters and numbers
const regExp_slugEn = /^[A-Za-z0-9-]+$/; // allow latin characters and numbers

export const slugSchema = (locale: TLocalesData = 'ar') =>
	z
		.string()
		.min(1, 'forms.validation.slug_required')
		.max(200, 'forms.validation.slug_max')
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

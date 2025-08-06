import { i18n } from 'i18next';
import { z } from 'zod';

// export type Tt = TFunction<['auth', 'validation']>
export type Tt = i18n['t'];
export type SignInInput = z.infer<ReturnType<typeof signInSchema>>;
export type SignUpInput = z.infer<ReturnType<typeof signUpSchema>>;

// fields validation --------------------------------------------------------
export const emailField = (t: Tt) =>
	z
		.string()
		.trim()
		.nonempty({ message: t('validation.email_required') })
		.email({ message: t('validation.invalid_email') });

export const passwordField = (t: Tt) =>
	z
		.string()
		.nonempty({ message: t('validation.password_required') })
		.min(8, { message: t('validation.min', { field_name: t('auth.password'), min: 8 }) });

// export const termsField = (t: Tt) =>
// 	z
// 		.literal(true, { errorMap: () => ({ message: t('validation.terms_required') }) })
// 		.refine((val) => val === true, { message: t('validation.terms_required') });

// forms schemas ----------------------------------------------------------------
export function signUpSchema(t: Tt) {
	return z.object({
		email: emailField(t),
		password: passwordField(t),
		name: z.string().nonempty({ message: t('validation.name_required') }),
	});
}
export function signInSchema(t: Tt) {
	return z.object({
		email: emailField(t),
		password: passwordField(t),
	});
}

export function forgotPasswordSchema(t: Tt) {
	return z.object({
		password: passwordField(t),
	});
}

export function resetPasswordSchema(t: Tt) {
	return z
		.object({
			password: passwordField(t),
			confirm_password: passwordField(t),
		})
		.refine((data) => data.password === data.confirm_password, {
			message: t('validation.confirm_password'),
			path: ['confirm_password'],
		});
}

export function changePasswordSchema(t: Tt) {
	return z
		.object({
			currentPassword: passwordField(t),
			new_password: passwordField(t),
			confirm_password: passwordField(t),
		})
		.refine((data) => data.new_password === data.confirm_password, {
			message: t('validation.confirm_password'),
			path: ['confirm_password'],
		});
}

export function verifyEmailSchema(t: Tt) {
	return z.object({
		otp: z
			.string()
			.min(6, { message: t('validation.otp_required') })
			.nonempty({ message: t('validation.otp_required') }),
	});
}

export function changeEmailSchema(t: Tt) {
	return z.object({
		email: emailField(t),
		password: passwordField(t),
	});
}

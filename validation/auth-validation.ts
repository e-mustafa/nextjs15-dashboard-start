import { msg, SchemaInput } from '@/lib/utils';
import { i18n } from 'i18next';
import { z } from 'zod';

export type Tt = i18n['t'];
export type SchemaSignUp = SchemaInput<() => typeof signUpSchema>;
export type SchemaSignIn = SchemaInput<() => typeof signInSchema>;

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

// forms schemas ------------------------------------------------------------

export const signUpSchema = z.object({
	email: emailField,
	password: passwordField,
	confirm_password: passwordField,
}).refine((data) => data.password === data.confirm_password, {
	message: 'validation.confirm_password',
	path: ['confirm_password'],
})

export const signInSchema = z.object({
	email: emailField,
	password: passwordField,
});

export const forgotPasswordSchema = z.object({
	password: passwordField,
});

export const resetPasswordSchema = z
	.object({
		password: passwordField,
		confirm_password: passwordField,
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'validation.confirm_password',
		path: ['confirm_password'],
	});

export const changePasswordSchema = z
	.object({
		currentPassword: passwordField,
		new_password: passwordField,
		confirm_password: passwordField,
	})
	.refine((data) => data.new_password === data.confirm_password, {
		message: 'validation.confirm_password',
		path: ['confirm_password'],
	});

export const verifyEmailSchema = z.object({
	otp: otpField,
});

export const changeEmailSchema = z.object({
	email: emailField,
	password: passwordField,
});

import { msg, SchemaInput } from '@/lib/utils';
import { i18n } from 'i18next';
import { z } from 'zod';
import { emailField, otpField, passwordField } from './fields-validation';

export type Tt = i18n['t'];
export type SchemaSignUp = z.infer<typeof signUpSchema>;
export type SchemaSignIn = z.infer<typeof signInSchema>;



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

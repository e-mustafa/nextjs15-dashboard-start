import { msg } from '@/lib/utils';
import { i18n } from 'i18next';
import { z } from 'zod';
import { emailField, passwordField } from './fields-validation';

console.log(
	'msg',
	msg('validation.min', {
		field_name: 'inputs.password_label',
		min: 8,
	})
);
export type MessageKey = string; // message is now just a string or a string with dynamic data in JSON
export type SchemaInput<T extends () => z.ZodTypeAny> = z.infer<ReturnType<T>>;

export type Tt = i18n['t'];
// export type SignInInput = z.infer<ReturnType<typeof signInSchema>>;
// export type SignUpInput = z.infer<ReturnType<typeof signUpSchema>>;

// Helper to encode dynamic messages
// const msg = (key: string, values?: Record<string, any>): string => (values ? `${key}|${JSON.stringify(values)}` : key);



// forms schemas ----------------------------------------------------------------
export function signUpSchema() {
	return z
		.object({
			email: emailField,
			password: passwordField,
			// name: z.string().nonempty({ message: 'validation.name_required' }),
			confirm_password: passwordField,
		})
		.refine((data) => data.password === data.confirm_password, {
			message: 'validation.confirm_password',
			path: ['confirm_password'],
		});
}

export function signInSchema() {
	return z.object({
		email: emailField,
		password: passwordField,
	});
}

export function forgotPasswordSchema() {
	return z.object({
		password: passwordField,
	});
}

export function resetPasswordSchema() {
	return z
		.object({
			password: passwordField,
			confirm_password: passwordField,
		})
		.refine((data) => data.password === data.confirm_password, {
			message: 'validation.confirm_password',
			path: ['confirm_password'],
		});
}

export function changePasswordSchema() {
	return z
		.object({
			currentPassword: passwordField,
			new_password: passwordField,
			confirm_password: passwordField,
		})
		.refine((data) => data.new_password === data.confirm_password, {
			message: 'validation.confirm_password',
			path: ['confirm_password'],
		});
}

export function verifyEmailSchema() {
	return z.object({
		otp: z.string().min(6, { message: 'validation.otp_required' }).nonempty({ message: 'validation.otp_required' }),
	});
}

export function changeEmailSchema() {
	return z.object({
		email: emailField,
		password: passwordField,
	});
}

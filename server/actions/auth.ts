'use server';

import { AuthResponse } from '@/components/auth/auth-form';
import { isDEV } from '@/configs/general';
import { ValidateFormAction } from '@/lib/utils.server/validate-data-server';
import { SchemaSignIn, SchemaSignUp, signInSchema, signUpSchema } from '@/validation/auth-validation';
import bcrypt from 'bcrypt';
import { prisma_DB } from '../../prisma/prisma.db';

export async function unknownError(error: string = 'api.errors.error') {
	isDEV && console.error('signup error:', error);

	return {
		success: false,
		status: 500,
		error,
	};
}

export async function signinAction<T>(formData: unknown): Promise<AuthResponse & { form_errors?: string }> {
	// const { t } = await initTranslations(locale, ['auth']);
	const result = await ValidateFormAction(signInSchema, formData);

	if (!result.success) {
		return {
			...result,
			form_errors: JSON.stringify(result.form_errors),
			error: 'api.errors.inputs_validation',
		};
	}

	const { email, password } = result.data as SchemaSignIn;

	try {
		const user = await prisma_DB.user.findUnique({ where: { email } });

		if (!user) {
			return {
				success: false,
				ok: false,
				status: 401,
				error: 'api.errors.account_not_found',
			};
		}

		const isValidPassword = await bcrypt.compare(password, user.password!);
		if (!isValidPassword) {
			return {
				success: false,
				ok: false,
				status: 401,
				error: 'api.errors.sign_in_failed',
			};
		}

		return {
			success: true,
			ok: true,
			status: 200,
			message: 'api.successes.sign_in_success',
		};
	} catch (error: any) {
		return unknownError(error);
	}
}

export async function signupAction(formData: unknown): Promise<AuthResponse & { form_errors?: string }> {
	// const { t } = await initTranslations(locale, ['auth']);
	const result = await ValidateFormAction(signUpSchema, formData);

	if (!result.success)
		return {
			...result,
			form_errors: JSON.stringify(result.form_errors),
			error: 'api.errors.inputs_validation',
		};

	const { email, password, confirm_password } = result.data as SchemaSignUp;

	if (password !== confirm_password) {
		return {
			success: false,
			status: 400,
			error: 'validation.password_mismatch',
		};
	}

	try {
		const existingUser = await prisma_DB.user.findUnique({ where: { email } });

		if (existingUser) {
			return {
				success: false,
				status: 409,
				error: 'api.errors.email_already_exists',
			};
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await prisma_DB.user.create({
			data: {
				email,
				password: hashedPassword,
			},
		});

		if (!newUser) return unknownError();

		const { password: _, ...userWithoutPassword } = newUser;

		return {
			success: true,
			status: 201,
			data: userWithoutPassword,
			message: 'api.successes.sign_up_success',
		};
	} catch (error: any) {
		return unknownError(error);
	}
}

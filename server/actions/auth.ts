'use server';

import { AuthResponse } from '@/components/auth/auth-form';
import { isDEV } from '@/configs/general';
import { SchemaInput, ValidateFormAction } from '@/lib/utils';
import { signInSchema, signUpSchema } from '@/validation/auth-validation';
import bcrypt from 'bcrypt';
import { prisma_DB } from '../db/prisma';

export async function unknownError(error: string = 'messages.errors.error') {
	isDEV && console.error('signup error:', error);

	return {
		success: false,
		status: 500,
		error,
	};
}

export async function signinAction(formData: SchemaInput<() => typeof signInSchema>, locale: string): Promise<AuthResponse> {
	// const { t } = await initTranslations(locale, ['auth']);
	const result = await ValidateFormAction(() => signInSchema, formData, locale);

	if (!result.success) {
		return {
			...result,
			error: typeof result.error === 'string' ? result.error : JSON.stringify(result.error),
		};
	}

	const { email, password } = result.data;

	try {
		const user = await prisma_DB.user.findUnique({ where: { email } });

		if (!user) {
			return {
				success: false,
				ok: false,
				status: 401,
				error: 'messages.errors.account_not_found',
			};
		}

		const isValidPassword = await bcrypt.compare(password, user.password!);
		if (!isValidPassword) {
			return {
				success: false,
				ok: false,
				status: 401,
				error: 'messages.errors.sign_in_failed',
			};
		}

		return {
			success: true,
			ok: true,
			status: 200,
			message: 'messages.successes.sign_in_success',
		};
	} catch (error: any) {
		return unknownError(error);
	}
}

export async function signupAction(formData: SchemaInput<() => typeof signUpSchema>, locale: string): Promise<AuthResponse> {
	// const { t } = await initTranslations(locale, ['auth']);
	const result = await ValidateFormAction(() => signUpSchema, formData, locale);

	if (!result.success)
		return {
			...result,
			error: typeof result.error === 'string' ? result.error : JSON.stringify(result.error),
		};

	const { email, password, confirm_password } = result.data;

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
				error: 'messages.errors.email_already_exists',
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
			message: 'messages.successes.sign_up_success',
		};
	} catch (error: any) {
		return unknownError(error);
	}
}

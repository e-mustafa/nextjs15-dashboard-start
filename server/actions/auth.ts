'use server';

import initTranslations from '@/app/i18n';
import { isDEV } from '@/configs/general';
import { Environments } from '@/constant/enums';
import { FormResultError, ValidateFormAction } from '@/lib/utils';
import { SchemaInput, signInSchema, signUpSchema, Tt } from '@/validation/auth-validation';
import bcrypt from 'bcrypt';
import { prisma_DB } from '../db/prisma';

export async function unknownError(error: any, t: Tt): Promise<FormResultError> {
	isDEV && console.error('signup error:', error);

	return {
		success: false,
		status: 500,
		error: t('messages.errors.error'),
	};
}

export async function signinAction(formData: SchemaInput<typeof signInSchema>, locale: string) {
	const { t } = await initTranslations(locale, ['auth']);

	console.log('formData', formData);

	const result = await ValidateFormAction(signInSchema, formData, locale);
	// console.log('signin formData', formData);
	console.log('signinAction result', result);

	if (!result.success) {
		return result;
	}

	const { data } = result as { data: SchemaInput<typeof signInSchema> };

	try {
		const user = await prisma_DB.user.findUnique({
			where: { email: data.email },
		});

		if (!user) {
			return {
				success: false,
				status: 401,
				message: t('messages.errors.account_not_found'),
				// formData,
			};
		}

		const { password, ...userWithoutPassword } = user;

		const isValidPassword = await bcrypt.compare(data.password, password!);
		if (!isValidPassword) {
			return {
				success: false,
				status: 401,
				message: t('messages.errors.invalid_credentials'),
				// formData,
			};
		}

		return {
			success: true,
			status: 200,
			// user: userWithoutPassword,
			message: t('messages.successes.sign_in_success'),
		};
	} catch (error: any) {
		Environments.DEV && console.error('signup error:', error);
		console.log('signIn Action catch error', error);
		return unknownError(error, t);
	}
}

export async function signupAction(formData: SchemaInput<typeof signUpSchema>, locale: string) {
	console.log('formData', formData);
	console.log('locale', locale);

	const { t } = await initTranslations(locale, ['auth']);

	const result = await ValidateFormAction(signUpSchema, formData, locale);
	// console.log('signin formData', formData);
	console.log('signUpAction result', result);
	console.log('Validation Result:', result);

	if (!result.success) {
		return result;
	}

	const { data } = result;
	console.log('Validated Data:', data);

	try {
		const user = await prisma_DB.user.findUnique({
			where: { email: data.email },
		});

		console.log('checking user', user);

		if (user) {
			return {
				success: false,
				status: 409,
				// error: t('messages.errors.email_already_exists'),
				error: 'messages.errors.email_already_exists',
				// formData,
			};
		}

		const hashedPassword = await bcrypt.hash(data.password, 10);
		const newUser = await prisma_DB.user.create({
			data: { email: data.email, password: hashedPassword },
		});

		if (!newUser) {
			return unknownError('Error creating user', t);
		}

		const { password, ...userWithoutPassword } = newUser;

		return {
			success: true,
			status: 201,
			user: userWithoutPassword,
			message: t('messages.successes.sign_up_success'),
		};
	} catch (error: any) {
		return unknownError(error, t);
	}
}

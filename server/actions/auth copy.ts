import initTranslations from '@/app/i18n';
import { prisma_DB } from '@/server/db/prisma';
import { SignInInput, signInSchema } from '@/validation/auth-validation';
import bcrypt from 'bcrypt';

// export const loginAction = async (conditionals: Record<T, string> | undefined, local: Locale): Promise<void> => { };

// export async function signinAction(data: Record<keyof typeof signInSchema, string>, locale: string) {

export async function signinAction(formData: SignInInput, locale: string) {
	const { t } = await initTranslations(locale, ['auth']);

	// const {success, error}= signInSchema(t).safeParse(formData);
	const result = signInSchema().safeParse(formData);
	console.log('signin formData', formData);
	console.log('signin result', result);

	if (!result.success) {
		return {
			success: false,
			status: 400,
			error: result.error.flatten().fieldErrors,
		};
	}

	try {
		const user = await prisma_DB.user.findUnique({
			where: { email: result.data.email },
		});

		if (!user) {
			return {
				success: false,
				status: 401,
				message: t('messages.errors.account_not_found'),
			};
		}

		const { password, ...userWithoutPassword } = user;

		const isValidPassword = await bcrypt.compare(result.data.password, password!);
		if (!isValidPassword) {
			return {
				success: false,
				status: 401,
				message: t('messages.errors.invalid_credentials'),
			};
		}

		return {
			success: true,
			status: 200,
			user: userWithoutPassword,
			message: t('messages.successes.login_success'),
		};
	} catch (error: any) {
		console.error('Login error:', error);
		return {
			success: false,
			status: 500,
			error: t('messages.errors.error'),
		};
	}
}

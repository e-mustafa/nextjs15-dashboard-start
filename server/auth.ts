import initTranslations from '@/app/i18n';
import { defaultLocale, isDEV } from '@/configs/general';
import { GeneralLinks } from '@/constant/enums';
import { prisma_DB } from '@/server/db/prisma';
import { signInSchema } from '@/validation/auth-validation copy';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthOptions = {
	session: {
		strategy: 'jwt',
		maxAge: 7 * 24 * 60 * 60, // 7 days
		updateAge: 24 * 60 * 60, // 24 hours
	},
	secret: process.env.NEXTAUTH_SECRET,
	debug: isDEV,
	providers: [
		Credentials({
			name: 'Credentials',
			credentials: {
				email: { label: 'email', type: 'text', placeholder: 'jsmith@example.com' },
				password: { label: 'Password', type: 'password' },
			},
			// credentials: {},
			// async authorize(credentials, request) {
			// 	// request.headers.set('Accept-Language', 'ar');
			// 	console.log('authorize request', request);
			// 	// const headers = await request?.header;
			// 	const locale = (await request.header?.get('x-locale')) || defaultLocale?.short;
			// 	console.log('locale', locale);
			// 	// Add your own logic here to find the user
			// 	// const res = await signinAction(new FormData(Object.entries(credentials || {})), 'en');
			// 	console.log('credentials data', credentials);

			// 	const res = await signinAction(credentials || {}, locale);
			// 	console.log('signin Action res:', res);

			// 	if (res.success && res.status === 200) {
			// 		const { id, email, name } = res.user;
			// 		return { id, email, name };
			// 	} else {
			// 		throw new Error(
			// 			JSON.stringify({
			// 				validationError: res.error,
			// 				responseError: res.message,
			// 			})
			// 		);
			// 	}
			// },

			async authorize(credentials, req) {
				const locale = req?.header?.get('x-locale') || defaultLocale.short;

				const {t  } = await initTranslations(locale, ['auth']);
				// Validate credentials using zod
				const parsed = signInSchema(t).safeParse(credentials);
				if (!parsed.success) {
					throw new Error(JSON.stringify({ validationError: parsed.error.flatten().fieldErrors }));
				}

				const { email, password } = parsed.data;

				// Check user from DB
				const user = await prisma_DB.user.findUnique({ where: { email } });
				console.log('next auth user', user);

				if (!user) {
					throw new Error(JSON.stringify({ responseError: 'messages.errors.account_not_found' }));
				}

				const isValidPassword = await bcrypt.compare(password, user.password!);
				if (!isValidPassword) {
					throw new Error(JSON.stringify({ responseError: 'messages.errors.sign_in_failed' }));
				}

				// Only return what's needed by NextAuth
				return {
					id: user.id,
					email: user.email,
					name: user.name,
					image: user.image,
					role: user.role,
				};
			},
		}),
	],
	adapter: PrismaAdapter(prisma_DB),
	pages: {
		signIn: `/${GeneralLinks.SIGN_IN}`,
		newUser: `/${GeneralLinks.SIGN_UP}`,
		// signOut: `/${GeneralLinks.SIGN_OUT}`,
		// signOut: '/auth/signout',
		// error: '/auth/error',
		// verifyRequest: '/auth/verify-request',
		// newUser: null, // Will disable the new account creation screen
	},
};

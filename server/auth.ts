import { isDEV } from '@/configs/general';
import { GeneralLinks } from '@/constant/enums';
import { prisma_DB } from '@/server/db/prisma';
import { signInSchema } from '@/validation/auth-validation';
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
			async authorize(credentials, req) {
				const parsed = signInSchema.safeParse(credentials);

				if (!parsed.success) {
					throw new Error(
						JSON.stringify({
							validationError: parsed.error.flatten().fieldErrors,
						})
					);
				}

				const { email, password } = parsed.data;

				const user = await prisma_DB.user.findUnique({ where: { email } });

				if (!user) {
					throw new Error(
						JSON.stringify({
							responseError: 'messages.errors.account_not_found',
						})
					);
				}

				const isValidPassword = await bcrypt.compare(password, user.password!);

				if (!isValidPassword) {
					throw new Error(
						JSON.stringify({
							responseError: 'messages.errors.sign_in_failed',
						})
					);
				}

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
	},
};

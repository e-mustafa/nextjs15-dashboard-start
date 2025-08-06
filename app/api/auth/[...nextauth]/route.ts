import { authConfig } from '@/server/auth';
import NextAuth from 'next-auth';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
   
   
   

// const authOptions = {
// 	providers: [],
// 	pages: {
// 		signIn: '/auth/signin',
// 		signOut: '/auth/signout',
// 		error: '/auth/error',
// 		verifyRequest: '/auth/verify-request',
// 		newUser: null, // Will disable the new account creation screen
// 	},
// 	callbacks: {
// 		async session({ session, token }) {
// 			session.user.id = token.sub;
// 			return session;
// 		},
// 	},
// 	secret: process.env.NEXTAUTH_SECRET,
// 	debug: process.env.NODE_ENV === 'development',
// };

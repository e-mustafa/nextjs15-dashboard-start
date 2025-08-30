import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { i18nRouter } from 'next-i18n-router';
import { NextRequest, NextResponse } from 'next/server';
import { GeneralLinks, UserRole } from './constant/enums';
import i18nConfig from './i18n.Config';

export default withAuth(middleware, {
	callbacks: {
		authorized: () => {
			// Allow all requests to pass through
			return true;
		},
	},
});
async function middleware(request: NextRequest) {
	// Use next-i18n-router to handle internationalization
	const response = i18nRouter(request, i18nConfig) ?? NextResponse.next();
	const pathname = request.nextUrl.pathname;

	// const response2 = NextResponse.next({
	// 	request: {
	// 		headers: requestHeaders,
	// 	},
	// });

	// set the locale in 'x-url' header
	const currentLocale = pathname.split('/')[1] || i18nConfig.defaultLocale;
	response?.headers.set('x-url', currentLocale);
	response?.headers.set('x-pathname', pathname);

	const isAuth = await getToken({ req: request });
	const isAuthPage = pathname.startsWith(`/${currentLocale}/${GeneralLinks.AUTH}`);
	const protectedRoute = [GeneralLinks.PROFILE, GeneralLinks.ADMIN];
	const isProtectedRoute = protectedRoute.some((route) => pathname.startsWith(`/${currentLocale}${route}`));

	//  redirect unauthenticated users to a login page
	if (!isAuth && !isAuthPage && isProtectedRoute) {
		const url = new URL(`/${currentLocale}/${GeneralLinks.AUTH}/${GeneralLinks.SIGN_IN}`, request.url);
		url.searchParams.set('callbackUrl', request.url);
		return NextResponse.redirect(url);
	}

	if (isAuth && isAuthPage) {
		// Redirect authenticated users appropriate route
		const role = isAuth.role;
		if (role === UserRole.ADMIN) {
			const url = new URL(`/${currentLocale}/${GeneralLinks.ADMIN}`, request.url);
			url.searchParams.set('callbackUrl', request.url);
			return NextResponse.redirect(url);
		} else if (role === UserRole.USER) {
			const url = new URL(`/${currentLocale}/${GeneralLinks.PROFILE}`, request.url);
			return NextResponse.redirect(url);
		}

		const url = new URL(`/${currentLocale}/`, request.url);
		return NextResponse.redirect(url);
	}

	// If the user is authenticated, allow the request to continue
	if (isAuth && pathname.startsWith(`/${currentLocale}/${GeneralLinks.ADMIN}`)) {
		// Check if the user has the admin role
		if (isAuth.role !== UserRole.ADMIN) {
			const url = new URL(`/${currentLocale}/${GeneralLinks.PROFILE}`, request.url);
			url.searchParams.set('callbackUrl', request.url);
			return NextResponse.redirect(url);
		}
	}

	return response;
}

export const config = {
	matcher: ['/((?!api|static|.*\\..*|_next).*)'],
};

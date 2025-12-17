// middleware.ts
import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { i18nRouter } from 'next-i18n-router';
import { NextRequest, NextResponse } from 'next/server';
import { GeneralLinks, UserRole } from './constant/enums-development';
import i18nConfig from './i18n.Config';

// ✅ Use NextAuth middleware wrapper
export default withAuth(middleware, {
	callbacks: {
		authorized: () => true, // Allow all, actual checks happen inside middleware()
	},
});

async function middleware(request: NextRequest) {
	// ✅ Handle locale routing
	const response = i18nRouter(request, i18nConfig) ?? NextResponse.next();
	const pathname = request.nextUrl.pathname;

	// ✅ Set locale and path in headers for later use (optional)
	const currentLocale = pathname.split('/')[1] || i18nConfig.defaultLocale;
	response.headers.set('x-url', currentLocale);
	response.headers.set('x-pathname', pathname);

	// ✅ Authentication checks
	const isAuth = await getToken({ req: request });
	const isAuthPage = pathname.startsWith(`/${currentLocale}/${GeneralLinks.AUTH}`);
	const protectedRoutes = [GeneralLinks.PROFILE, GeneralLinks.ADMIN];
	const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(`/${currentLocale}${route}`));

	// 🔒 Redirect unauthenticated users to login
	if (!isAuth && !isAuthPage && isProtectedRoute) {
		const url = new URL(`/${currentLocale}/${GeneralLinks.AUTH}/${GeneralLinks.SIGN_IN}`, request.url);
		url.searchParams.set('callbackUrl', request.url);
		return NextResponse.redirect(url);
	}

	// 👤 Redirect authenticated users away from auth pages
	if (isAuth && isAuthPage) {
		const role = isAuth.role;
		if (role === UserRole.ADMIN) {
			return NextResponse.redirect(new URL(`/${currentLocale}/${GeneralLinks.ADMIN}`, request.url));
		} else if (role === UserRole.USER) {
			return NextResponse.redirect(new URL(`/${currentLocale}/${GeneralLinks.PROFILE}`, request.url));
		}
		return NextResponse.redirect(new URL(`/${currentLocale}/`, request.url));
	}

	// ⚙️ Role-based protection for admin routes
	if (isAuth && pathname.startsWith(`/${currentLocale}/${GeneralLinks.ADMIN}`)) {
		if (isAuth.role !== UserRole.ADMIN) {
			const url = new URL(`/${currentLocale}/${GeneralLinks.PROFILE}`, request.url);
			url.searchParams.set('callbackUrl', request.url);
			return NextResponse.redirect(url);
		}
	}

	// ✅ Continue request
	return response;
}

// ✅ Limit matcher to non-static routes only
export const config = {
	matcher: ['/((?!api|static|.*\\..*|_next).*)'],
	// ❌ Removed: runtime: 'nodejs'
};

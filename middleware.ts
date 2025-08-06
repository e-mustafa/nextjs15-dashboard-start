import { i18nRouter } from 'next-i18n-router';
import { NextRequest, NextResponse } from 'next/server';
import i18nConfig from './i18n.Config';

export function middleware(request: NextRequest): NextResponse {
	const response = i18nRouter(request, i18nConfig);

	// set the locale in header
	const locale = request.nextUrl.pathname.split('/')[1] || i18nConfig.defaultLocale;
	response.headers.set('x-locale', locale);

	return response;
}

export const config = {
	matcher: '/((?!api|static|.*\\..*|_next).*)',
};

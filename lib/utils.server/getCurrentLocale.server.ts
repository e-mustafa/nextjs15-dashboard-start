'use server';
import { defaultLocale, TLocalesData } from '@/configs/general';
import i18nConfig from '@/i18n.Config';
import { headers } from 'next/headers';

export default async function getCurrentLocale() {
	const h = await headers();
	const locale = h.get('x-url') || h.get('NEXT_LOCALE') || i18nConfig.defaultLocale || defaultLocale.short;
	console.log('getCurrentLocale', locale);
	return locale as TLocalesData;
}

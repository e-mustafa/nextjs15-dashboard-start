import { TLocalesData } from '@/configs/general';
import i18nConfig from '@/i18n.Config';
import getCurrentLocale from '@/lib/getCurrentLocale.server';
import { createInstance, i18n, InitOptions, Resources } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next/initReactI18next';

export default async function initTranslations(
	namespaces: string[],
	locale?: TLocalesData | undefined,
	i18nInstance?: i18n,
	resources?: Resources
): Promise<{
	i18n: i18n;
	resources: Resources;
	t: i18n['t'];
	dir: 'rtl' | 'ltr';
	locale: TLocalesData;
}> {
	// server: try to get locale from headers
	// client: LanguageDetector is the one that determines

	locale = locale || (await getCurrentLocale());

	i18nInstance = i18nInstance || createInstance();
	i18nInstance
		.use(LanguageDetector) // 👈 for client
		.use(initReactI18next);

	if (!resources) {
		i18nInstance.use(
			resourcesToBackend((language: string, namespace: string) => import(`@/locales/${language}/${namespace}.json`))
		);
	}

	await i18nInstance.init({
		lng: locale, // 👈 fallback for server
		resources,
		fallbackLng: i18nConfig.defaultLocale,
		supportedLngs: i18nConfig.locales,
		defaultNS: namespaces[0],
		fallbackNS: namespaces[0],
		ns: namespaces,
		preload: resources ? [] : i18nConfig.locales,
		detection: {
			order: ['querystring', 'localStorage', 'cookie', 'navigator', 'htmlTag'],
			caches: ['localStorage', 'cookie'],
			lookupQuerystring: 'locale',
			lookupLocalStorage: 'App-Language',
			lookupCookie: 'NEXT_LOCALE',
		},
	} as InitOptions);

	const language = i18nInstance.language || locale;
	const dir =
		(await Promise.resolve(await i18nInstance.dir(language)).catch(() => (language === 'ar' ? 'rtl' : 'ltr'))) || 'ltr';

	return {
		i18n: i18nInstance,
		resources: {
			[locale as TLocalesData]: i18nInstance.services.resourceStore.data[locale as TLocalesData] as unknown as string,
		},
		t: i18nInstance.t,
		locale: language as TLocalesData,
		dir,
	};
}

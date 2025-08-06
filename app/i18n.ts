// i18n/initTranslations.ts
import i18nConfig from '@/i18n.Config';
import { createInstance, i18n, InitOptions } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next/initReactI18next';

// type Resource : same as the translation structure (useful when passing the translation directly from the server, for example)
type Resource = {
	[language: string]: {
		[namespace: string]: Record<string, string>;
	};
};

export default async function initTranslations(
	locale: string,
	namespaces: string[],
	i18nInstance?: i18n,
	resources?: Resource
): Promise<{
	i18n: i18n;
	resources: Resource;
	t: i18n['t'];
}> {
	i18nInstance = i18nInstance || createInstance();

	i18nInstance.use(initReactI18next);

	if (!resources) {
		i18nInstance.use(
			resourcesToBackend((language: string, namespace: string) => import(`@/locales/${language}/${namespace}.json`))
		);
	}

	await i18nInstance.init({
		lng: locale,
		resources,
		fallbackLng: i18nConfig.defaultLocale,
		supportedLngs: i18nConfig.locales,
		defaultNS: namespaces[0],
		fallbackNS: namespaces[0],
		ns: namespaces,
		preload: resources ? [] : i18nConfig.locales,
	} as InitOptions);

	return {
		i18n: i18nInstance,
		resources: {
			[locale]: i18nInstance.services.resourceStore.data[locale],
		} as Resource,
		t: i18nInstance.t,
	};
}

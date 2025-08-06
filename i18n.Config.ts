import { defaultLocale, localesData } from './configs/general';

const i18nConfig = {
	locales: Object.keys(localesData),
	defaultLocale: defaultLocale.short,
	prefixDefault: true,
	localeDetection: true,
	
};

export default i18nConfig;

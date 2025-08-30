export const seoData = {
	ar: {
		title: 'INFINITY',
		description: 'موقعنا على الويب',
		keywords: ['next.js', 'i18n', 'localization'],
		siteName: 'اسم الموقع',
		locale: 'ar_AR',
	},
	en: {
		title: 'INFINITY',
		description: 'Our website',
		keywords: ['next.js', 'i18n', 'localization'],
		siteName: 'Site name',
		locale: 'en_US',
	},
};

export type SEOData = (typeof seoData)[keyof typeof seoData];
export type SEODataKey = keyof typeof seoData;
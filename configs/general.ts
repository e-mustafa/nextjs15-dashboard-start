export const domain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000' as string;

export const localesData = {
	ar: {
		short: 'ar',
		dir: 'rtl',
		label: 'العربية',
		flag: '/assets/images/lang_ar_flag_arabic.svg',
	},
	en: {
		short: 'en',
		dir: 'ltr',
		label: 'English',
		flag: '/assets/images/lang_en_flag_english.svg',
	},
} as const;
export type LocalesData = keyof typeof localesData;
export const defaultLocale = localesData['ar'];
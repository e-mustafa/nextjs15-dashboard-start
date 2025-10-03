import { Environments } from '@/constant/enums';

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
export type TLocalesData = keyof typeof localesData;
export const defaultLocale = localesData['ar'];

export const nextRevalidateData = 60;

export const config_env = {
	environment: process.env.NODE_ENV!,
	domain: process.env.NEXT_PUBLIC_DOMAIN!,
	domainAPI: process.env.NEXT_PUBLIC_API!,
	imageKit: {
		urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
		publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
		privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
	},
};

export const isDEV = process.env.NODE_ENV === Environments.DEV;
export const isPROD = process.env.NODE_ENV === Environments.PROD;

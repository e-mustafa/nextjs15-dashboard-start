import { TLocalesData } from '@/configs/general';
import getCurrentLocale from './getCurrentLocale.server';

/**
 * Maps translations given as an array of objects to a flat object
 * with keys in the format of "name_lang" and values as the translated text.
 *
 * If Accept-Language header is provided, it will map the translations
 * to the language specified in the header.
 * If no Accept-Language header is provided, it will map all translations to a flat object with keys in the
 * format of "name_lang".
 * Example: { name_ar: 'اهلا', name_en: 'hello' }
 *
 * @param translations - an array of objects with lang and name fields
 * @param options - an object with headers, fields and defaultLang
 * @param options.headers - an object with headers
 * @param options.fields - an array of fields to map translations
 * @param options.defaultLang - the default language
 * @returns a flat object with keys in the format of "name_lang" and values as the translated text
 */

export async function mapTranslations<T extends { lang: string }>(
	translations: T[],
	options?: {
		accept_language?: string | undefined;
		fields?: string[];
		defaultLang?: TLocalesData;
	}
): Promise<Record<string, any>> {
	const { accept_language = '*', fields, defaultLang = await getCurrentLocale() } = options || {};

	const transAll = accept_language === '*';
	const acceptLang = accept_language?.split(',')[0]?.trim();

	console.log('acceptLang', acceptLang);

	// ------------------------------
	// 1. if language was provided Accept-Language, return only one translation
	// ------------------------------
	if (!transAll) {
		const tr = translations.find((t) => t.lang === acceptLang) || translations.find((t) => t.lang === defaultLang);

		console.log('tr11111', tr);
		if (!tr) return {};

		const obj: Record<string, any> = {};
		for (const field of fields || Object.keys(tr)) {
			if (field === 'lang' || field === 'id') continue;
			obj[field as string] = tr[field as keyof T];
		}
		return obj;
	}

	// ------------------------------
	// 2. if no language was provided Accept-Language, return all translations
	// ------------------------------
	const obj: Record<string, any> = {};

	for (const tr of translations) {
		console.log('tr22222', tr);
		for (const field of fields || Object.keys(tr)) {
			if (field === 'lang' || field === 'id') continue;
			obj[`${String(field)}_${tr.lang}`] = tr[field as keyof T];
		}
	}

	return obj;
}

import { TLocalesData } from '@/configs/general';
import getCurrentLocale from './getCurrentLocale.server';

/**
 * Maps translations given as an array of objects to a flat object
 * with keys in the format of "name_lang" and values as the translated text.
 * with fallback support for empty values
 *
 * If `Accept-Language` header is provided, it will map the translations
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
		enableFallback?: boolean;
	}
): Promise<Record<string, any>> {
	const {
		accept_language = '*',
		fields,
		defaultLang = await getCurrentLocale(),
		enableFallback = true, // ← enable fallback by default
	} = options || {};

	const transAll = accept_language === '*';
	const acceptLang = accept_language?.split(',')[0]?.trim();

	// 🟢 1. if Accept-Language provided → return one translation
	if (!transAll) {
		const tr = translations.find((t) => t.lang === acceptLang) || translations.find((t) => t.lang === defaultLang);
		if (!tr) return {};

		const obj: Record<string, any> = {};

		// Get fallback translation if enabled
		const fallbackTr = enableFallback ? translations.find((t) => t.lang !== tr.lang) : undefined;

		for (const field of fields || Object.keys(tr)) {
			if (field === 'lang' || field === 'id') continue;
			const val = tr[field as keyof T];

			// If the value is empty or null, use the value from the other language
			if (enableFallback && (val === null || val === undefined || val === '')) {
				const fallbackVal = fallbackTr?.[field as keyof T];
				obj[field] = fallbackVal === null || fallbackVal === undefined ? '' : fallbackVal;
			} else {
				obj[field] = val === null ? '' : val;
			}
		}
		return obj;
	}

	// 🟢 2. if no Accept-Language provided → return all translations with fallback
	const obj: Record<string, any> = {};

	// Group translations by language
	const translationsByLang = new Map<string, T>();
	for (const tr of translations) {
		translationsByLang.set(tr.lang, tr);
	}

	// Get available languages
	const languages = Array.from(translationsByLang.keys());

	for (const tr of translations) {
		const currentLang = tr.lang;
		// Get the other language for fallback
		const otherLang = languages.find((lang) => lang !== currentLang);
		const fallbackTr = otherLang ? translationsByLang.get(otherLang) : undefined;

		for (const field of fields || Object.keys(tr)) {
			if (field === 'lang' || field === 'id') continue;
			const val = tr[field as keyof T];
			const fieldKey = `${String(field)}_${tr.lang}`;

			// If the value is empty or null, use the value from the other language
			if (enableFallback && (val === null || val === undefined || val === '')) {
				const fallbackVal = fallbackTr?.[field as keyof T];
				obj[fieldKey] = fallbackVal === null || fallbackVal === undefined ? '' : fallbackVal;
			} else {
				obj[fieldKey] = val === null ? '' : val;
			}
		}
	}

	return obj;
}

/**
 * apply fallback to a single object
 */
export function applyTranslationFallback<T extends Record<string, any>>(data: T, primaryLang: 'ar' | 'en' = 'ar'): T {
	const secondaryLang = primaryLang === 'ar' ? 'en' : 'ar';
	const result: Record<string, any> = { ...data };

	// Get all field names that have language suffixes
	const fields = new Set<string>();
	for (const key of Object.keys(data)) {
		const match = key.match(/^(.+)_(ar|en)$/);
		if (match) {
			fields.add(match[1]);
		}
	}

	// Apply fallback for each field
	for (const field of fields) {
		const primaryKey = `${field}_${primaryLang}`;
		const secondaryKey = `${field}_${secondaryLang}`;

		// If primary is empty, use secondary
		if (!data[primaryKey] && data[secondaryKey]) {
			result[primaryKey] = data[secondaryKey];
		}

		// If secondary is empty, use primary
		if (!data[secondaryKey] && data[primaryKey]) {
			result[secondaryKey] = data[primaryKey];
		}
	}

	return result as T;
}

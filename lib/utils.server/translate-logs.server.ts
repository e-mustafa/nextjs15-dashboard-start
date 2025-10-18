import { isDEV, TLocalesData } from '@/configs/general';
import i18nConfig from '@/i18n.Config';
import { createInstance, TFunction } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next/initReactI18next';

/**
 * ✅ Parse a msg() string like "api.errors.duplicate_entry|{"field_name":"email"}"
 */
function parseMessage(message: string): { key: string; values?: Record<string, any> } {
	if (message.includes('|')) {
		try {
			const [key, rawJson] = message.split('|');
			const values = JSON.parse(rawJson);
			return { key, values };
		} catch (e) {
			if (isDEV) console.warn('⚠️ Invalid msg() format:', message);
		}
	}
	return { key: message };
}

/**
 * ✅ Initialize a lightweight i18n instance for server-side translation.
 * Loads only specific namespaces and one locale (no browser detection or React binding).
 */
async function initServerI18n(locale: string, namespaces: string[]): Promise<TFunction> {
	const i18n = createInstance();

	i18n.use(initReactI18next);
	i18n.use(resourcesToBackend((lng: string, ns: string) => import(`@/locales/${lng}/${ns}.json`)));

	await i18n.init({
		lng: locale,
		ns: namespaces,
		fallbackLng: i18nConfig.defaultLocale,
		supportedLngs: i18nConfig.locales,
		defaultNS: namespaces[0],
		fallbackNS: namespaces,
		interpolation: { escapeValue: false },
		debug: false,
	});

	return i18n.t.bind(i18n);
}

/**
 * ✅ Translate a server-side msg() string into a localized human-readable message.
 * - Supports multi-namespace loading.
 * - Translates embedded field names.
 * - Handles invalid or missing keys gracefully.
 *
 * Example:
 * translateServerMessage('api.errors.duplicate_entry|{"field_name":"email"}', 'ar', ['api', 'common'])
 */
export async function translateServerMessage(
	message: string,
	namespaces: string[] = ['common'],
	locale: TLocalesData = i18nConfig.defaultLocale
): Promise<string> {
	try {
		const { key, values } = parseMessage(message);
		const t = await initServerI18n(locale, namespaces);

		// Translate field_name or any other nested translation key inside values
		if (values) {
			for (const [k, v] of Object.entries(values)) {
				if (typeof v === 'string' && v.includes('.')) {
					values[k] = t(v);
				}
			}
		}

		const translated = t(key, values);
		return translated || key;
	} catch (error) {
		if (isDEV) console.error('❌ Failed to translate server message:', error);
		return message;
	}
}

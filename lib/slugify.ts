import setSlug from 'slugify';

type slugifyOptions = {
	locale?: string;
	replacement?: string;
	lower?: boolean;
	strict?: boolean;
	trim?: boolean;
	remove?: RegExp;
};

/**
 * Slugify a given text string.
 * It takes into account the locale (ar/en) and other options such as replacement, lower, strict, and trim.
 * @param {string} text - the text string to be slugified
 * @param {string} [locale='ar'] - the locale to be used for slugifying, either 'ar' or 'en'
 * @param {slugifyOptions} [options] - an object with options for slugifying
 * @returns {string} - the slugified text string
 */
export function slugify(text: string, locale: string = 'ar', options?: slugifyOptions) {
	const { lang = locale, replacement = '-', lower = true, trim = true, ...rest } = (options = {});

	if (lang === 'ar') {
		// allow arabic, latin characters and numbers
		return text
			.normalize('NFKD')
			.replace(/[^\u0600-\u06FFA-Za-z0-9\s]/g, '')
			.trim()
			.replace(/\s+/g, replacement)
			.replace(new RegExp(`^${replacement}+|${replacement}+$`, 'g'), '')
			.toLowerCase();
	}

	return setSlug(text, {
		replacement,
		lower,
		locale: lang,
		trim,
		...rest,
	});
}

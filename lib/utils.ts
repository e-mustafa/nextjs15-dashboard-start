import { clsx, type ClassValue } from 'clsx';
import { TFunction } from 'i18next';
import { twMerge } from 'tailwind-merge';
import z, { ZodTypeAny } from 'zod/v3';
// import z, { ZodSchema, ZodTypeAny } from 'zod';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Render error message with dynamic values.
 * If the message contains "|", it is split into key and raw json.
 * The raw json is parsed and the field_name is translated using the t function.
 * The translated message is then returned, or the original message if there is an error.
 * @param {string} message - The error message to render.
 * @param {TFunction} t - The translation function.
 * @returns {string} - The rendered error message.
 */
// export function renderErrorMessage(message: string, t: TFunction): string {
// 	console.log('message', message);
// 	try {
// 		if (message.includes('|')) {
// 			const [key, rawJson] = message.split('|');
// 			const values = JSON.parse(rawJson);
// 			if (values.field_name) values.field_name = t(values.field_name);
// 			// return t(key, values);
// 			return t(key, values).toString();
// 		}

// 		return t(message);
// 	} catch (e) {
// 		console.warn('Invalid error message:', message);
// 		return message;
// 	}
// }

export function renderErrorMessage(message: string, t: TFunction): string {
	try {
		if (message.includes('|')) {
			const [key, rawJson] = message.split('|');
			const values = JSON.parse(rawJson);

			// Translate any value that looks like a translation key
			for (const [k, v] of Object.entries(values)) {
				// if (typeof v === 'string' && v.startsWith('common.')) {
				values[k] = t(v as string);
				// }
			}

			return t(key, values).toString();
		}

		return t(message);
	} catch (e) {
		console.warn('Invalid error message:', message);
		return message;
	}
}

type TranslationMsg = string | { key: string; values?: Record<string, any> };

export const msg = (key: string, values?: Record<string, any>): string =>
	values ? `${key}|${JSON.stringify(values)}` : key;

export type TError =
	| string
	| { [key: string]: string }
	| { responseError: string | string[]; validationError: string | string[] }
	| undefined;

export type FormResultSuccess<T> = {
	success: true;
	ok?: boolean;
	status: number;
	data: T;
	message?: string;
	form_errors?: string;
	// error?: TError;
};

export type FormResultError<T> = {
	success: false;
	ok?: false;
	status: number;
	error: TError;
	form_errors?: string; // FieldErrors<T extends FieldValues ? FieldValues : object>;
	formData?: FormData;
};

export type FormResult<T> = FormResultSuccess<T> | FormResultError<T>;

export type SchemaInput<T extends () => ZodTypeAny> = z.infer<ReturnType<T>>;

// export type ValidationResult<T> =
// 	| { success: true; ok?: true; data: T }
// 	| { success: false; ok?: false; status: number; formData: unknown; form_errors: Record<string, string[]> };

// export async function ValidateFormAction<T>(schema: ZodType<T, any, any>, formData: unknown): Promise<ValidationResult<T>> {
// 	console.log('formData');
// 	const result = schema.safeParse(formData);

// 	if (!result.success) {
// 		return {
// 			success: false,
// 			status: 400,
// 			formData,
// 			// error: result.error.flatten().fieldErrors as Record<string, string[]>,
// 			form_errors: result.error.flatten().fieldErrors as Record<string, string[]>,
// 		};
// 	}

// 	return {
// 		success: true,
// 		ok: true,
// 		data: result.data,
// 	};
// }

// type slugifyOptions = {
// 	locale?: string;
// 	replacement?: string;
// 	lower?: boolean;
// 	strict?: boolean;
// 	trim?: boolean;
// 	remove?: RegExp;
// };

// export function slugify(text: string, locale: string = 'ar', options?: slugifyOptions) {
// 	const { lang = locale, replacement = '-', lower = true, trim = true, ...rest } = (options = {});

// 	if (lang === 'ar') {
// 		// allow arabic, latin characters and numbers
// 		return text
// 			.normalize('NFKD')
// 			.replace(/[^\u0600-\u06FFA-Za-z0-9\s]/g, '')
// 			.trim()
// 			.replace(/\s+/g, replacement)
// 			.replace(new RegExp(`^${replacement}+|${replacement}+$`, 'g'), '')
// 			.toLowerCase();
// 	}

// 	return setSlug(text, {
// 		replacement,
// 		lower,
// 		locale: lang,
// 		trim,
// 		...rest,
// 	});
// }

export function getBackLink(pathname: string): string {
	const parts = pathname.split('/').filter(Boolean); // remove empty parts
	parts.pop(); // remove the last part
	return '/' + parts.join('/');
}

import { clsx, type ClassValue } from 'clsx';
import { TFunction } from 'i18next';
import { twMerge } from 'tailwind-merge';
import { ZodType } from 'zod';
import z, { ZodTypeAny } from 'zod/v3';
// import z, { ZodSchema, ZodTypeAny } from 'zod';
import setSlug from 'slugify';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function renderErrorMessage(message: string, t: TFunction): string {
	try {
		if (message.includes('|')) {
			const [key, rawJson] = message.split('|');
			const values = JSON.parse(rawJson);
			if (values.field_name) values.field_name = t(values.field_name);
			// return t(key, values);
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
	ok: boolean;
	data: T;
	message?: string;
	error?: TError;
};

export type FormResultError = {
	success: false;
	ok: false;
	status: number;
	error: TError;
	formData?: FormData;
};

export type FormResult<T> = FormResultSuccess<T> | FormResultError;

export type SchemaInput<T extends () => ZodTypeAny> = z.infer<ReturnType<T>>;

export type ValidationResult<T> =
	| { success: true; ok?: true; data: T }
	| { success: false; ok?: false; status: number; formData: unknown; error: Record<string, string[]> };

export async function ValidateFormAction<T>(schema: ZodType<T, any, any>, formData: unknown): Promise<ValidationResult<T>> {
	const result = schema.safeParse(formData);

	if (!result.success) {
		return {
			success: false,
			status: 400,
			formData,
			error: result.error.flatten().fieldErrors as Record<string, string[]>,
		};
	}

	return {
		success: true,
		ok: true,
		data: result.data,
	};
}

type slugifyOptions = {
	locale?: string;
	replacement?: string;
	lower?: boolean;
	strict?: boolean;
	trim?: boolean;
	remove?: RegExp;
};

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

export function getBackLink(pathname: string): string {
	const parts = pathname.split('/').filter(Boolean); // remove empty parts
	parts.pop(); // remove the last part
	return '/' + parts.join('/');
}

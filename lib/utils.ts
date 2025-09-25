import { clsx, type ClassValue } from 'clsx';
import { TFunction } from 'i18next';
import { twMerge } from 'tailwind-merge';
import z, { ZodTypeAny } from 'zod';

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

export async function ValidateFormAction<T extends () => ZodTypeAny>(
	schemaFn: T,
	formData: z.infer<ReturnType<T>>,
	locale: string
): Promise<FormResult<z.infer<ReturnType<T>>>> {
	const schema = schemaFn();
	const result = schema.safeParse(formData);

	if (!result.success) {
		return {
			success: false,
			ok: false,
			status: 400,
			error: result.error.flatten().fieldErrors,
		};
	}

	return {
		success: true,
		ok: true,
		data: result.data as z.infer<ReturnType<T>>,
	};
}


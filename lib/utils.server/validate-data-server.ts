import { ZodType } from 'zod';

export type ValidationResult<T> =
	| { success: true; ok?: true; data: T, message?: string }
	| { success: false; ok?: false; status: number; formData: unknown; form_errors: Record<string, string[]> };

export async function ValidateFormAction<T>(schema: ZodType<T, any, any>, formData: unknown): Promise<ValidationResult<T>> {
	console.log('formData');
	const result = schema.safeParse(formData);

	if (!result.success) {
		return {
			success: false,
			status: 400,
			formData,
			// error: result.error.flatten().fieldErrors as Record<string, string[]>,
			form_errors: result.error.flatten().fieldErrors as Record<string, string[]>,
		};
	}

	return {
		success: true,
		ok: true,
		data: result.data,
	};
}

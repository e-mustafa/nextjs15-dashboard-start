// utils/formResponseHandler.ts
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface ApiResponse {
	success?: boolean;
	message?: string;
	error?: string;
	form_errors?: string;
}

/**
 * Handle form response from server.
 *
 * If the response has a success flag set to false and form_errors field,
 * it will parse the form_errors field and set the errors in the form.
 * If the response has a success flag set to true and a message field,
 * it will show a success toast with the message.
 * If the response has an error field, it will show an error toast.
 *
 * @param {ApiResponse} res - response from server
 * @param {UseFormReturn<T>} form - the form object
 * @param {t?: (key: string) => string} t - translation function
 * @return {boolean} - true if the response is success, false otherwise
 */
export function handleFormResponse<T extends FieldValues>(
	res: ApiResponse,
	form: UseFormReturn<T>,
	t?: (key: string) => string
): boolean {
	if (!res.success && res?.form_errors) {
		if (res.error) {
			console.log('res.error');
			toast.error(t ? t(res.error) : 'api.errors.unexpected');
		}
		try {
			const formErrors = JSON.parse(res.form_errors) as Record<keyof T, string>;

			console.log('formErrors', formErrors);

			Object.entries(formErrors).forEach(([field, message], index) => {
				form.setError(
					field as Path<T>,
					{
						type: 'server',
						message,
					},
					{ shouldFocus: index === 0 }
				);
			});

			console.log('Form Errors:', formErrors);
		} catch (err) {
			console.error('Invalid form_errors JSON:', err);
		}
		return false;
	}

	if (res.success && res.message) {
		console.log('res.success', res);
		toast.success(t ? t(res.message) : res.message);
		// form.reset(res?.data);
		return true;
	}

	return false;
}

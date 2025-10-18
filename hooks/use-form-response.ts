// hooks/use-form-response.ts
'use client';
import { handleServerResponse } from '@/hooks/use-server-response';
import { ActionResult } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DefaultValues, FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { renderErrorMessage } from '../lib/utils';

export function useFormResponse<T extends FieldValues>(
	res: ActionResult | null,
	form: UseFormReturn<T>,
	options: {
		redirectUrl?: string;
		reset_on_success?: boolean | DefaultValues<T>;
	}
) {
	const { t } = useTranslation();
	const router = useRouter();

	useEffect(() => {
		if (!res) return;

		handleServerResponse(res, t);

		if (!res.success && res.form_errors) {
			try {
				const formErrors = JSON.parse(res.form_errors) as Record<keyof T, string>;
				Object.entries(formErrors).forEach(([field, message], index) => {
					form.setError(field as Path<T>, { type: 'server', message }, { shouldFocus: index === 0 });
				});
			} catch (err) {
				console.error('Invalid form_errors JSON:', err);
			}
			if (res.error) toast.error(renderErrorMessage(res.error, t));
			return;
		}

		if (res.success && res.message) {
			if (options.reset_on_success) form.reset(options.reset_on_success === true ? undefined : options.reset_on_success);

			if (options.redirectUrl || res.redirect_to) router.push(options.redirectUrl || res.redirect_to!);
		}
	}, [res, form, options.reset_on_success, options.redirectUrl, t, router]);
}

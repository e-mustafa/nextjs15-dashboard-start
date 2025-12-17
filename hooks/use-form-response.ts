// hooks/use-form-response.ts
'use client';
import { isDEV } from '@/configs/general';
import { handleServerResponse } from '@/hooks/use-server-response';
import { ActionResult } from '@/types/api';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { DefaultValues, FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { renderErrorMessage } from '../lib/utils';

/**
 * useFormResponse hook is used to handle server responses for react-hook-form.
 *
 * It takes an ActionResult object and a useFormReturn object as parameters.
 * It also takes an options object which can have the following properties:
 *
 * `redirectUrl`: a string that will be used to redirect the user after a successful form submission.
 *
 *  `reset_on_success`: a boolean or DefaultValues object that will be used to reset the form after a successful form submission.
 *
 * `storageKey`: a string that will be used to store the form data in local storage and retrieve it after a successful form submission.
 *
 * The hook will handle server responses by calling handleServerResponse and will update the form errors and values accordingly.
 * It will also redirect the user to the redirectUrl if given.
 * It will also reset the form to the given DefaultValues if given.
 * It will also remove the form data from local storage if a storageKey is given.
 */
export function useFormResponse<T extends FieldValues>(
	res: ActionResult | null,
	form: UseFormReturn<T>,
	options: {
		redirectUrl?: string;
		reset_on_success?: boolean | DefaultValues<T>; // T | T[];
		storageKey?: string;
	}
) {
	const { redirectUrl, reset_on_success, storageKey } = options || {};
	const { t } = useTranslation();
	const router = useRouter();
	const pathname = usePathname();

	const isInitialLoad = useRef(true);
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);

	// -------------------------------------------
	// 1) LOAD LOCALSTORAGE ONCE
	// -------------------------------------------
	useEffect(() => {
		if (!storageKey) return;
		if (!pathname.endsWith('create')) return;

		const saved = localStorage.getItem(storageKey);
		if (saved) {
			try {
				form.reset(JSON.parse(saved));
			} catch (e) {
				isDEV && console.error('Invalid localStorage JSON:', e);
			}
		}

		isInitialLoad.current = false; // allow saving afterward
	}, [storageKey, pathname]);

	// -------------------------------------------
	// 2) SAVE ONLY WHEN USER INPUT CHANGES
	// -------------------------------------------
	useEffect(() => {
		if (!storageKey) return;
		if (!pathname.endsWith('create')) return;

		const subscription = form.watch((values) => {
			// block saving during mount
			if (isInitialLoad.current) return;

			// block saving until user edits something
			if (!form.formState.isDirty) return;

			// debounce save
			if (debounceTimer.current) clearTimeout(debounceTimer.current);

			debounceTimer.current = setTimeout(() => {
				localStorage.setItem(storageKey, JSON.stringify(values));
			}, 400);
		});

		return () => {
			subscription.unsubscribe();
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [storageKey, pathname, form]);

	// -------------------------------------------
	// 3) HANDLE SERVER RESPONSE
	// -------------------------------------------
	useEffect(() => {
		if (!res) return;

		handleServerResponse(res, t);

		if (!res.success && res.form_errors) {
			try {
				const errors = JSON.parse(res.form_errors) as Record<keyof T, string>;
				Object.entries(errors).forEach(([field, msg], index) => {
					form.setError(field as Path<T>, { type: 'server', message: msg }, { shouldFocus: index === 0 });
				});
			} catch (err) {
				isDEV && console.error('Invalid form_errors JSON:', err);
			}

			if (res.error) toast.error(renderErrorMessage(res.error, t));
			return;
		}

		if (res.success && res.message) {
			if (reset_on_success) {
				form.reset(reset_on_success === true ? undefined : reset_on_success);
			}

			if (storageKey) localStorage.removeItem(storageKey);

			if (redirectUrl || res.redirect_to) {
				router.push(redirectUrl || res.redirect_to!);
			}
		}
	}, [res, form, redirectUrl, reset_on_success, t, router, storageKey]);
}

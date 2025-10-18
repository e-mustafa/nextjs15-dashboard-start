'use client';
import { renderErrorMessage } from '@/lib/utils';
import { ActionResult } from '@/types/api';
import { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

/**
 * Hook to display success and error messages from server responses
 */
export function useServerResponse(result: ActionResult | null | undefined) {
	const { t } = useTranslation();

	useEffect(() => {
		if (!result) return;
		handleServerResponse(result, t);
	}, [result?.success, result?.message, result?.error, t]);
}

/**
 * show toast messages for success and error
 */
export function handleServerResponse(result: ActionResult, t: TFunction) {
	if (!result.success && (result.error || result.message)) {
		toast.error(renderErrorMessage(result.error || result.message!, t));
		return false;
	}

	if (result.success && result.message) {
		toast.success(renderErrorMessage(result.message, t));
		return true;
	}

	return result.success;
}

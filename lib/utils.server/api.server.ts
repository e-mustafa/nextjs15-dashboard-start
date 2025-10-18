'use server';

import { config_env, isDEV, TLocalesData } from '@/configs/general';
import { ActionResult } from '@/types/api';
import { cookies } from 'next/headers';
import { runAction } from '../error-handler/error-handler.server';
import getCurrentLocale from './getCurrentLocale.server';
import Error from 'next/error';

export const getToken = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get('token')?.value ?? '';
	return `Bearer ${token}`;
};

interface TGetDataInPage {
	url_segment: string; // link "dashboard/brands"
	id?: string;
	tags?: string[];
	options?: RequestInit;
	query?: Record<string, string | number | undefined | null>; // ✅ query params
	locale?: TLocalesData;
}

export async function getDataInServer<T>({
	url_segment,
	id = '',
	options = {},
	tags = [],
	query = {},
	locale,
}: TGetDataInPage): Promise<ActionResult<T>> {
	// try {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Authorization: `Bearer ${await getToken()}`,
		};

		if (!id) {
			headers['accept-language'] = locale || (await getCurrentLocale());
		}

		// ✅ Use URL and URLSearchParams for better handling of query parameters
		const url = new URL(`${config_env.domainAPI}/${url_segment}/${id}`);
		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
		});

		const useCache = !id && tags.length > 0;

		console.log('🔗 Fetching from:', url.toString());
		console.log('🧾 Headers:', headers);

		const res = await fetch(url.toString(), {
			method: 'GET',
			headers,
			cache: useCache ? 'default' : 'no-store',
			next: useCache ? { tags, revalidate: 60 } : undefined,
			...options,
		});

		console.log('🧾 res:', res);

		const data = await res.json();
		return data;
	// } catch (error: any) {
	// 	if (isDEV) console.error('Error in getDataInServer:', error);
	// 	return {
	// 		success: false,
	// 		status: 500,
	// 		error: error.message.includes('Unexpected token')? 'api.errors.unexpected': error.message, // (error as Error).message,
	// 	};
	// }
}

/**
 * Fetches data from server API with caching and query params.
 * If `id` is empty, the `accept-language` header will be set to the current locale.
 * If `tags` is not empty, the response will be cached for 60 seconds.
 * If `query` is not empty, the query params will be appended to the URL.
 * @param {TGetDataInPage} options
 * @returns {Promise<ActionResult<T>>}
 */
export async function getDataInPage<T>(params: TGetDataInPage) {
	return runAction(() => getDataInServer<T>(params));
}

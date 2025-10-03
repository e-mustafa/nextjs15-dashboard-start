'use server';
import { config_env, nextRevalidateData, TLocalesData } from '@/configs/general';
import { cookies } from 'next/headers';
import { ActionResult } from './error-handler/errorsApp';
import getCurrentLocale from './getCurrentLocale.server';
// import { redirectWithToast } from './redirect-with-toast';

export const getToken = async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get('token')?.value ?? '';
	return `Bearer ${token}`;
};

// export const getCookie = async () => {
//    const cookieStore = await cookies();
//    const token = cookieStore.get('token')?.value ?? '';
//    return token;
// };

interface TGetDataInPage {
	url_segment: string;
	id?: string;
	tags?: string[];
	options?: any;
	locale?: TLocalesData;
}

export async function getDataInPage<T>({
	url_segment,
	id = '',
	options = {},
	tags = [],
	locale,
}: TGetDataInPage): Promise<ActionResult<T>> {
	const headers = {
		'Content-Type': 'application/json',
		Accept: 'application/json',
		Authorization: await getToken(),
	};

	if (!id) {
		Object.assign(headers, { 'accept-language': locale || (await getCurrentLocale()) });
	}

	const res = await fetch(`${config_env.domainAPI}/${url_segment}/${id}`, {
		method: 'GET',
		headers,
		cache: id ? 'no-store' : 'force-cache',
		next: !id ? { tags: [...tags], revalidate: nextRevalidateData || 60 } : undefined,
		...options,
	});

	const data = await res.json();
	console.log('getDataInPage data', data);

	return data;
}

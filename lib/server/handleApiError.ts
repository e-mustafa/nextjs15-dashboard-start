// lib/server/handleApiError.ts

import { isDEV } from '@/configs/general';
import { AppError } from '@/lib/server/error-handler/errorsApp';

// const isDEV = process.env.NODE_ENV === 'development';

export function handleApiError(e: unknown): Response {
	if (e instanceof AppError) {
		if (isDEV) {
			console.error('AppError:', e);
		}
		return Response.json(
			{
				error: e.message,
				details: e.details,
				status: e.status,
				ok: false,
			},
			{ status: e.status }
		);
	}

	if (isDEV) {
		console.error('Unexpected Error:', e);
	}

	return Response.json({ error: 'api.errors.unexpected', ok: false, status: 500 }, { status: 500 });
}

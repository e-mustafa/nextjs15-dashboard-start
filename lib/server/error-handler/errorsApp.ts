import { isDEV } from '@/configs/general';

export type Result<T> = {
	success: boolean;
	status: number;
	data?: T | null;
	error?: string;
	message?: string;
	details?: any;
	form_errors?: string;
};

export class AppError extends Error {
	status: number;
	details?: any;

	constructor(message: string, status = 400, details?: any) {
		super(message);
		this.status = status;
		this.details = details;
	}
}

/**
 * response structure
 */
export type ActionResult<T = any> = {
	success: boolean;
	status: number;
	data?: T;
	error?: string;
	details?: any;
	message?: string;
	form_errors?: string;
};

/**
 * error handler
 */
export function handleError<T = unknown>(e: unknown): Result<T> {
	if (e instanceof AppError) {
		const errorResponse = { success: false, status: e.status, error: e.message };
		isDEV && console.error('AppError:', { ...errorResponse, details: e.details });

		return errorResponse;
	}
	isDEV && console.error('Unexpected Error:', e);
	return { success: false, status: 500, error: 'api.errors.unexpected' };
}

export async function runAction<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
	try {
		return await fn();
	} catch (e) {
		return handleError<T>(e);
	}
}

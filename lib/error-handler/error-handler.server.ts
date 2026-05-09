import { isDEV } from '@/configs/general';
import { msg } from '@/lib/utils';
import { ActionResult } from '@/types/api';
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { logger } from '../logs/logger';
import { translateServerMessage } from '../utils.server/translate-logs.server';

// export type ActionResult<T = any> = {
// success: boolean;
// status: number;
// data?: T | T[] | undefined;
// error?: string | undefined;
// details?: any;
// message?: string | undefined;
// form_errors?: string | undefined;
// total?: number | undefined;
// meta?: ApiMeta | undefined;
// };

type TObject = { [key: string]: string | any };

export class AppError extends Error {
	status: number;
	details?: any;

	constructor(message: string, status = 400, details?: any) {
		super(message);
		this.status = status;
		this.details = details;
	}
}

const namespaces = ['common', 'dashboard', 'auth'];

export async function handleErrorServer<T = unknown>(e: unknown): Promise<ActionResult<T>> {
	if (e instanceof AppError) {
		const resp = { success: false, status: e.status, error: e.message };

		const humanMessage = await translateServerMessage(e.message, namespaces);
		logger.warn(`AppError: ${humanMessage}`, { context: 'AppError' });

		if (isDEV) console.error('AppError:', { ...resp, error: humanMessage, details: e.details });
		return resp;
	}

	if (e instanceof PrismaClientKnownRequestError) {
		const humanMessage = await translateServerMessage(e.message, namespaces);
		logger.error(`PrismaError [${e.code}]: ${humanMessage}`, { context: 'Database' });

		if (isDEV) console.error('Prisma known error:', e);

		switch (e.code) {
			case 'P2002':
				return {
					success: false,
					status: 409,
					error: msg('api.errors.duplicate_entry', { field: e.meta?.target }),
					details: e.meta,
				};
			case 'P2025':
				return {
					success: false,
					status: 404,
					error: 'api.errors.not_found_in_db',
				};
			default:
				return {
					success: false,
					status: 500,
					error: msg('api.errors.error_in_db_with_code', { code: e.code }),
					// message: msg('api.errors.error_in_db_with_code', { code: e.code }),
				};
		}
	}

	if (typeof e === 'object' && e !== null && 'code' in e && typeof (e as TObject).code === 'string') {
		const humanMessage = await translateServerMessage((e as TObject).message, namespaces);
		logger.error(`PrismaError [${e.code}]: ${humanMessage}`, { context: 'Database' });
		const code = (e as TObject).code;
		if (code === 'P2002') {
			return {
				success: false,
				status: 409,
				error: msg('api.errors.duplicate_entry', { field: (e as TObject).meta?.target }),
				// message: msg('api.errors.duplicate_entry', { field: (e as TObject).meta?.target }),
				details: (e as TObject).meta,
			};
		}
		if (code === 'P2025') {
			return {
				success: false,
				status: 404,
				error: 'api.errors.not_found_in_db',
				details: (e as { [key: string]: string }).meta,
			};
		}

		return {
			success: false,
			status: 500,
			error: msg('api.errors.error_in_db_with_code', { code: e.code }),
			// message: msg('api.errors.error_in_db_with_code', { code: e.code }),
			details: (e as TObject).meta,
		};
	}

	if (isDEV) {
		console.error('\n🔥 Unexpected error in Action Server:\n', JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
	}
	logger.error(`Unhandled Error: ${JSON.stringify(e)}  -> stack: ${(e as Error).stack}`, { context: 'Server' });

	return {
		success: false,
		status: 500,
		error: 'api.errors.unexpected',
		...(isDEV && { details: e, stack: (e as Error).stack }),
	};
}

/**
 * ✅ Wrapper for async actions with safe error handling
 */
export async function runAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
	try {
		return await fn();
	} catch (e) {
		return handleErrorServer<T>(e);
	}
}

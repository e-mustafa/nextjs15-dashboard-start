import { isDEV } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { ActionResult } from '@/types/api';
import { NextResponse } from 'next/server';
import { logger } from '../logs/logger';
import { translateServerMessage } from '../utils.server/translate-logs.server';

export type HandlerContext = {
	params?: Record<string, string>;
};

export type Handler<T = any> = (req: Request, ctx?: HandlerContext) => Promise<ActionResult<T>>;

const namespaces = ['common', 'dashboard', 'auth'];

/**
 * Safely serializes complex objects for JSON (Date, BigInt, undefined).
 */
function sanitizeForJSON(value: unknown): unknown {
	return JSON.parse(
		JSON.stringify(value, (_, v) => {
			if (v instanceof Date) return v.toISOString();
			if (typeof v === 'bigint') return v.toString();
			if (v === undefined) return null;
			return v;
		})
	);
}

export function errorHandler(handlers: Record<string, Handler>) {
	const wrapped: Record<string, (req: Request, ctx?: HandlerContext) => Promise<NextResponse>> = {};

	for (const [method, handler] of Object.entries(handlers)) {
		wrapped[method] = async (req: Request, ctx?: HandlerContext) => {
			logger.info(`${method} ${req.url}`, { context: 'API' });

			try {
				const result = await handler(req, ctx);
				logger.info(`${method} ${req.url} -> ${result?.status || 200}`, { context: 'API' });

				const safeResult = sanitizeForJSON(result);
				return NextResponse.json(safeResult, { status: result.status });
			} catch (err: unknown) {
				// ✅ AppError (user-defined)
				if (err instanceof AppError) {
					if (isDEV) {
						console.error(
							'\n🧩 AppError caught in API route:\n',
							JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
						);
					}

					const humanMessage = await translateServerMessage(err.message, namespaces);
					logger.error(`${method} ${req.url} -> ${humanMessage}`, { context: 'API' });

					const responseBody = {
						success: false,
						status: err.status,
						error: err.message,
						details: err.details,
						...(isDEV && { stack: err.stack }),
					} satisfies ActionResult<null>;

					return NextResponse.json(responseBody, { status: err.status });
				}

				// ❌ Unexpected / unhandled error
				if (isDEV) {
					console.error(
						'\n🔥 Unexpected error in API route:\n',
						JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
					);
				}

				logger.error(`${method} ${req.url} -> unexpected error`, { context: 'API' });

				const responseBody = {
					success: false,
					status: 500,
					error: 'api.errors.unexpected',
					...(isDEV && { details: String(err), stack: (err as Error)?.stack }),
				} satisfies ActionResult<null>;

				return NextResponse.json(responseBody, { status: 500 });
			}
		};
	}

	return wrapped;
}

import { isDEV } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { ActionResult } from '@/types/api';
import { NextResponse } from 'next/server';
import { logger } from '../logs/logger';
import { translateServerMessage } from '../utils.server/translate-logs.server';

// 👇 Context type (support params in Next.js App Router)
export type HandlerContext = {
	params?: Record<string, string>;
};

// 👇 every handler return Result<T>
export type Handler<T = any> = (req: Request, ctx?: HandlerContext) => Promise<ActionResult<T>>;

const namespaces = ['common', 'dashboard', 'auth'];

export function errorHandler(handlers: Record<string, Handler>) {
	const wrapped: Record<string, (req: Request, ctx?: HandlerContext) => Promise<NextResponse>> = {};

	for (const [method, handler] of Object.entries(handlers)) {
		wrapped[method] = async (req: Request, ctx?: HandlerContext) => {
			logger.info(`${method} ${req.url}`, { context: 'API' });
			try {
				const result = await handler(req, ctx);
				logger.info(`${method} ${req.url} -> ${result?.status || 200}`, { context: 'API' });

				return NextResponse.json(result, { status: result.status });
			} catch (err: unknown) {
				if (err instanceof AppError) {
					if (isDEV) console.error('Unexpected error in API route:', err);
					// logger.error(`${method} ${req.url} -> ${err.message}`, { context: 'API' });

					const humanMessage = await translateServerMessage(err.message, namespaces);
					logger.error(`${method} ${req.url} -> ${humanMessage}`, { context: 'API' });

					return NextResponse.json(
						{
							success: false,
							status: err.status,
							error: err.message,
							details: err.details,
						} satisfies ActionResult<null>,
						{ status: err.status }
					);
				}

				logger.error(`${method} ${req.url} -> unexpected error`, { context: 'API' });

				return NextResponse.json(
					{
						success: false,
						status: 500,
						// error: 'api.errors.unexpected',
						error: 'api.errors.unexpected',
					} satisfies ActionResult<null>,
					{ status: 500 }
				);
			}
		};
	}

	return wrapped;
}

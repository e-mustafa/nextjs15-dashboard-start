import { AppError, Result } from '@/lib/server/error-handler/errorsApp';
import { NextResponse } from 'next/server';

// 👇 Context type (support params in Next.js App Router)
export type HandlerContext = {
	params?: Record<string, string>;
};

// 👇 every handler return Result<T>
export type Handler<T = any> = (req: Request, ctx?: HandlerContext) => Promise<Result<T>>;

export function errorHandler(handlers: Record<string, Handler>) {
	const wrapped: Record<string, (req: Request, ctx?: HandlerContext) => Promise<NextResponse>> = {};

	for (const [method, handler] of Object.entries(handlers)) {
		wrapped[method] = async (req: Request, ctx?: HandlerContext) => {
			try {
				const result = await handler(req, ctx);
				return NextResponse.json(result, { status: result.status });
			} catch (err: unknown) {
				if (err instanceof AppError) {
					return NextResponse.json(
						{
							success: false,
							status: err.status,
							error: err.message,
							details: err.details,
						} satisfies Result<null>,
						{ status: err.status }
					);
				}

				return NextResponse.json(
					{
						success: false,
						status: 500,
						error: 'api.errors.unexpected',
					} satisfies Result<null>,
					{ status: 500 }
				);
			}
		};
	}

	return wrapped;
}

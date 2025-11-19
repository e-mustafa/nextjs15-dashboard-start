import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { toggleStateProduct } from '@/server/services/product-service';

// GET /api/products/:id

async function toggleStateProductAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	console.log('toggleStateProductAction body', body);
	return toggleStateProduct(id, body);
}

export const { GET, PUT, DELETE } = errorHandler({
	BATCH: toggleStateProductAction,
});

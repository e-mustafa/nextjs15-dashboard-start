import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { toggleStateBrand } from '@/server/services/brand-service';

// GET /api/brands/:id

async function toggleStateBrandAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	console.log('toggleStateBrandAction body', body);
	return toggleStateBrand(id, body);
}

export const { GET, PUT, DELETE } = errorHandler({
	BATCH: toggleStateBrandAction,
});

import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { toggleStateCollection } from '@/server/services/collection-service';

// GET /api/collections/:id

async function toggleStateCollectionAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	console.log('toggleStateCollectionAction body', body);
	return toggleStateCollection(id, body);
}

export const { GET, PUT, DELETE } = errorHandler({
	BATCH: toggleStateCollectionAction,
});

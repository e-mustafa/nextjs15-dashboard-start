import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { toggleStateCategory } from '@/server/services/category-service';

// GET /api/categories/:id

async function toggleStateCategoryAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return toggleStateCategory(id, body);
}

export const { GET, PUT, DELETE } = errorHandler({
	BATCH: toggleStateCategoryAction,
});

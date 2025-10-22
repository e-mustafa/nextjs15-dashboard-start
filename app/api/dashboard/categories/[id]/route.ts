import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { deleteCategory, getCategory, updateCategory } from '@/server/services/category-service';

// GET /api/categories/:id

async function getCategoryAction(_req: Request, ctx?: HandlerContext) {
	if (!ctx?.params?.id) throw new AppError('api.errors.invalid_id', 400);
	return getCategory(ctx.params.id);
}

async function updateCategoryAction(req: Request, ctx?: HandlerContext) {
	if (!ctx?.params?.id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return updateCategory(ctx.params.id, body);
}

async function deleteCategoryAction(_req: Request, ctx?: HandlerContext) {
	if (!ctx?.params?.id) throw new AppError('api.errors.invalid_id', 400);
	return deleteCategory(ctx.params.id);
}

export const { GET, PUT, DELETE } = errorHandler({
	GET: getCategoryAction,
	PUT: updateCategoryAction,
	DELETE: deleteCategoryAction,
});

import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { deleteCategory, getCategory, updateCategory } from '@/server/services/category-service';

// GET /api/categories/:id

async function getCategoryAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return getCategory(id);
}

async function updateCategoryAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return updateCategory(id, body);
}

async function deleteCategoryAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return deleteCategory(id);
}

export const { GET, PUT, DELETE } = errorHandler({
	GET: getCategoryAction,
	PUT: updateCategoryAction,
	DELETE: deleteCategoryAction,
});

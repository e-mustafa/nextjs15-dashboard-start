import { TLocalesData } from '@/configs/general';
import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { deleteCategory, getCategory, updateCategory } from '@/server/services/category-service';

// GET /api/categories/:id

async function getCategoryAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	const locale = (_req.headers.get('accept-language') as TLocalesData) || (await getCurrentLocale());
	return getCategory(id, locale);
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

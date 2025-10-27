import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { deleteBrand, getBrand, updateBrand } from '@/server/services/brand-service';

// GET /api/brands/:id

async function getBrandAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return getBrand(id);
}

async function updateBrandAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return updateBrand(id, body);
}

async function deleteBrandAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return deleteBrand(id);
}

export const { GET, PUT, DELETE } = errorHandler({
	GET: getBrandAction,
	PUT: updateBrandAction,
	DELETE: deleteBrandAction,
});

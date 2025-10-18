import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { deleteBrand, getBrand, updateBrand } from '@/server/services/brand-service';

// GET /api/brands/:id

async function getBrandAction(_req: Request, ctx?: HandlerContext) {
	if (!ctx?.params?.id) throw new AppError('api.errors.invalid_id', 400);
	return getBrand(ctx.params.id);
}

async function updateBrandAction(req: Request, ctx?: HandlerContext) {
	if (!ctx?.params?.id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return updateBrand(ctx.params.id, body);
}

async function deleteBrandAction(_req: Request, ctx?: HandlerContext) {
	if (!ctx?.params?.id) throw new AppError('api.errors.invalid_id', 400);
	return deleteBrand(ctx.params.id);
}

export const { GET, PUT, DELETE } = errorHandler({
	GET: getBrandAction,
	PUT: updateBrandAction,
	DELETE: deleteBrandAction,
});

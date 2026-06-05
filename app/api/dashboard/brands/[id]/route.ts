import { TLocalesData } from '@/configs/general';
import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { deleteBrand, getBrand, updateBrand } from '@/server/services/brand-service';

// GET /api/brands/:id

async function getBrandAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);

	const locale = (req.headers.get('accept-language') as TLocalesData) || (await getCurrentLocale());
	return getBrand(id, locale);
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

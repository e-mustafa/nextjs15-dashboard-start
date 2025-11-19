import { TLocalesData } from '@/configs/general';
import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { getRelatedProducts } from '@/server/services/product-service';

/**
 * ✅ GET /api/products/[id]/related - Get related products
 */
async function getRelatedProductsAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};

	if (!id) {
		throw new AppError('api.errors.invalid_id', 400);
	}

	const { searchParams } = new URL(req.url);
	const acceptLanguage = req.headers.get('accept-language') || (await getCurrentLocale());

	const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 6;

	return getRelatedProducts(id, limit, acceptLanguage as TLocalesData);
}

// ✅ Export with centralized error handling
export const { GET } = errorHandler({
	GET: getRelatedProductsAction,
});

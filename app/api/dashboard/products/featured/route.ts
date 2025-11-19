import { TLocalesData } from '@/configs/general';
import { errorHandler } from '@/lib/error-handler/error-handler-route';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { getFeaturedProducts } from '@/server/services/product-service';

/**
 * ✅ GET /api/products/featured - Get featured products
 */
async function getFeaturedProductsAction(req: Request) {
	const { searchParams } = new URL(req.url);
	const acceptLanguage = req.headers.get('accept-language') || (await getCurrentLocale());

	const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;

	return getFeaturedProducts(limit, acceptLanguage as TLocalesData);
}

// ✅ Export with centralized error handling
export const { GET } = errorHandler({
	GET: getFeaturedProductsAction,
});

import { TLocalesData } from '@/configs/general';
import { errorHandler } from '@/lib/error-handler/error-handler-route';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { getProductsAsOptions } from '@/server/services/product-service';

/**
 * ✅ GET /api/products - Get all products with filters
 */
async function getProductsAsOptionsAction(req: Request) {
	const { searchParams } = new URL(req.url);
	const acceptLanguage = req.headers.get('accept-language') || (await getCurrentLocale());

	const params = {
		page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
		limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
		search: searchParams.get('search') || undefined,
	};

	return getProductsAsOptions(params, acceptLanguage as TLocalesData);
}

// ✅ Export with centralized error handling
export const { GET, POST, DELETE, PATCH } = errorHandler({
	GET: getProductsAsOptionsAction,
});

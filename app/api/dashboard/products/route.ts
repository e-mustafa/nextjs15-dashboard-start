import { TLocalesData } from '@/configs/general';
import { errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import {
	bulkUpdateProductStatus,
	createProduct,
	deleteManyProducts,
	getAllProducts,
} from '@/server/services/product-service';

/**
 * ✅ GET /api/products - Get all products with filters
 */
async function getProductsAction(req: Request) {
	const { searchParams } = new URL(req.url);
	const acceptLanguage = req.headers.get('accept-language') || (await getCurrentLocale());

	const params = {
		page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
		limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
		search: searchParams.get('search') || undefined,
		brandId: searchParams.get('brandId') || undefined,
		categoryId: searchParams.get('categoryId') || undefined,
		collectionId: searchParams.get('collectionId') || undefined,
		isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
		isFeatured: searchParams.get('isFeatured') ? searchParams.get('isFeatured') === 'true' : undefined,
		inStock: searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : undefined,
		sortBy: searchParams.get('sortBy') || undefined,
		sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
	};

	return getAllProducts(params, acceptLanguage as TLocalesData);
}

/**
 * ✅ POST /api/products - Create new product
 */
async function createProductAction(req: Request) {
	const body = await req.json();

	if (!body.name_ar || !body.name_en) {
		throw new AppError('api.errors.name_required', 400);
	}

	if (!body.sku) {
		throw new AppError('api.errors.sku_required', 400);
	}

	return createProduct(body);
}

/**
 * ✅ DELETE /api/products - Delete multiple products
 */
async function deleteProductsAction(req: Request) {
	const { ids } = await req.json();

	if (!ids || !Array.isArray(ids) || ids.length === 0) {
		throw new AppError('api.errors.empty_ids', 400);
	}

	return deleteManyProducts(ids);
}

/**
 * ✅ PATCH /api/products - Bulk update products status
 */
async function bulkUpdateProductsAction(req: Request) {
	const { ids, isActive } = await req.json();

	if (!ids || !Array.isArray(ids) || ids.length === 0) {
		throw new AppError('api.errors.empty_ids', 400);
	}

	if (typeof isActive !== 'boolean') {
		throw new AppError('api.errors.invalid_status', 400);
	}

	return bulkUpdateProductStatus(ids, isActive);
}

// ✅ Export with centralized error handling
export const { GET, POST, DELETE, PATCH } = errorHandler({
	GET: getProductsAction,
	POST: createProductAction,
	DELETE: deleteProductsAction,
	PATCH: bulkUpdateProductsAction,
});

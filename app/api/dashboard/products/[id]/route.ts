import { TLocalesData } from '@/configs/general';
import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import {
	deleteProduct,
	getProduct,
	toggleFeaturedProduct,
	toggleStateProduct,
	updateProduct,
	updateProductStock,
} from '@/server/services/product-service';

/**
 * ✅ GET /api/products/[id] - Get single product by ID, SKU, or Slug
 */
async function getProductAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};

	if (!id) {
		throw new AppError('api.errors.invalid_id', 400);
	}

	const acceptLanguage = req.headers.get('accept-language') || (await getCurrentLocale());

	return getProduct(id, acceptLanguage as TLocalesData);
}

/**
 * ✅ PUT /api/products/[id] - Update product
 */
async function updateProductAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};

	if (!id) {
		throw new AppError('api.errors.invalid_id', 400);
	}

	const body = await req.json();

	if (!body.name_ar || !body.name_en) {
		throw new AppError('api.errors.name_required', 400);
	}

	if (!body.sku) {
		throw new AppError('api.errors.sku_required', 400);
	}

	return updateProduct(id, body);
}

/**
 * ✅ DELETE /api/products/[id] - Delete single product
 */
async function deleteProductAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};

	if (!id) {
		throw new AppError('api.errors.invalid_id', 400);
	}

	return deleteProduct(id);
}

/**
 * ✅ PATCH /api/products/[id] - Toggle product status (active/featured)
 */
async function patchProductAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};

	if (!id) {
		throw new AppError('api.errors.invalid_id', 400);
	}

	const body = await req.json();

	// Toggle active status
	if ('isActive' in body && typeof body.isActive === 'boolean') {
		return toggleStateProduct(id, body.isActive);
	}

	// Toggle featured status
	if ('isFeatured' in body && typeof body.isFeatured === 'boolean') {
		return toggleFeaturedProduct(id, body.isFeatured);
	}

	// Update stock
	if ('stockQuantity' in body && typeof body.stockQuantity === 'number') {
		const operation = body.operation || 'set';
		return updateProductStock(id, body.stockQuantity, operation);
	}

	throw new AppError('api.errors.invalid_patch_data', 400);
}

// ✅ Export with centralized error handling
export const { GET, PUT, DELETE, PATCH } = errorHandler({
	GET: getProductAction,
	PUT: updateProductAction,
	DELETE: deleteProductAction,
	PATCH: patchProductAction,
});

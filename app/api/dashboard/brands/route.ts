import { errorHandler } from '@/lib/server/error-handler/error-handler-route';
import { AppError } from '@/lib/server/error-handler/errorsApp';
import { createBrand, deleteManyBrands, getAllBrands } from '@/lib/services/brandService';

// GET /api/brands
async function getBrandsAction(_req: Request) {
	return getAllBrands();
}

// POST /api/brands
async function createBrandAction(req: Request) {
	const body = await req.json();
	return createBrand(body);
}

// DELETE /api/brands
async function deleteBrandsAction(req: Request) {
	const body = await req.json();
	if (!body?.ids || !Array.isArray(body.ids)) {
		throw new AppError('api.errors.invalid_ids', 400);
	}
	return deleteManyBrands(body.ids);
}

export const { GET, POST, DELETE } = errorHandler({
	GET: getBrandsAction,
	POST: createBrandAction,
	DELETE: deleteBrandsAction,
});

import { TLocalesData } from '@/configs/general';
import { errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import * as collectionService from '@/server/services/collection-service';
// ✅ Route GET Handler
async function getCollectionsAction(req: Request) {
	const { searchParams } = new URL(req.url);
	// get accept language from header
	const acceptLanguage = req.headers.get('accept-language') || (await getCurrentLocale());

	const params = {
		page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
		limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
		search: searchParams.get('search') || undefined,
		sortBy: searchParams.get('sortBy') || undefined,
		sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | undefined,
	};

	console.log('params', params);

	return collectionService.getAllCollections(params, acceptLanguage as TLocalesData);
}

// ✅ Route POST Handler
async function createCollectionAction(req: Request) {
	const body = await req.json();
	if (!body.name) throw new AppError('Name is required', 400);
	return collectionService.createCollection(body);
}

// ✅ Route DELETE Handler
async function deleteCollectionsAction(req: Request) {
	const { ids } = await req.json();
	return collectionService.deleteManyCollections(ids);
}

// ✅ export with centralized error handling
export const { GET, POST, DELETE } = errorHandler({
	GET: getCollectionsAction,
	POST: createCollectionAction,
	DELETE: deleteCollectionsAction,
});

import { TLocalesData } from '@/configs/general';
import { errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import * as tagService from '@/server/services/tag-service';
// ✅ Route GET Handler
async function getTagsAction(req: Request) {
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

	return tagService.getAllTags(params);
}

// ✅ Route POST Handler
async function createTagAction(req: Request) {
	const body = await req.json();
	if (!body.name) throw new AppError('Name is required', 400);
	return tagService.createTag(body);
}

// ✅ Route DELETE Handler
// async function deleteTagsAction(req: Request) {
// 	const { ids } = await req.json();
// 	return tagService.deleteManyTags(ids);
// }

// ✅ export with centralized error handling
export const { GET, POST, DELETE } = errorHandler({
	GET: getTagsAction,
	POST: createTagAction,
	// DELETE: deleteTagsAction,
});

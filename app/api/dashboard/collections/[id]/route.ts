import { TLocalesData } from '@/configs/general';
import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import getCurrentLocale from '@/lib/utils.server/getCurrentLocale.server';
import { deleteCollection, getCollection, updateCollection } from '@/server/services/collection-service';

// GET /api/collections/:id

async function getCollectionAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const locale = req.headers.get('accept-language') as TLocalesData || (await getCurrentLocale());
	return getCollection(id, locale);
}

async function updateCollectionAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return updateCollection(id, body);
}

async function deleteCollectionAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return deleteCollection(id);
}

export const { GET, PUT, DELETE } = errorHandler({
	GET: getCollectionAction,
	PUT: updateCollectionAction,
	DELETE: deleteCollectionAction,
});

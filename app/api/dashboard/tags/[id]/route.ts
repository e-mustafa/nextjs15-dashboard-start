import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { deleteTag } from '@/server/services/tag-service';

// GET /api/tags/:id

// async function getTagAction(_req: Request, ctx?: HandlerContext) {
// 	const { id } = (await ctx?.params) ?? {};
// 	if (!id) throw new AppError('api.errors.invalid_id', 400);
// 	return getTag(id);
// }

// async function updateTagAction(req: Request, ctx?: HandlerContext) {
// 	const { id } = (await ctx?.params) ?? {};
// 	if (!id) throw new AppError('api.errors.invalid_id', 400);
// 	const body = await req.json();
// 	return updateTag(id, body);
// }

async function deleteTagAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return deleteTag(id);
}

export const { GET, PUT, DELETE } = errorHandler({
	// GET: getTagAction,
	// PUT: updateTagAction,
	DELETE: deleteTagAction,
});

import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { deleteDiscount, getDiscount, updateDiscount } from '@/server/services/discount-service';

// GET /api/discounts/:id

async function getDiscountAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return getDiscount(id);
}

async function updateDiscountAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return updateDiscount(id, body);
}

async function deleteDiscountAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return deleteDiscount(id);
}

export const { GET, PUT, DELETE } = errorHandler({
	GET: getDiscountAction,
	PUT: updateDiscountAction,
	DELETE: deleteDiscountAction,
});

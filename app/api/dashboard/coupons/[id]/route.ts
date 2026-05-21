import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { deleteCoupon, getCoupon, updateCoupon } from '@/server/services/coupon-service';

// GET /api/coupons/:id

async function getCouponAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return getCoupon(id);
}

async function updateCouponAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return updateCoupon(id, body);
}

async function deleteCouponAction(_req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	return deleteCoupon(id);
}

export const { GET, PUT, DELETE } = errorHandler({
	GET: getCouponAction,
	PUT: updateCouponAction,
	DELETE: deleteCouponAction,
});

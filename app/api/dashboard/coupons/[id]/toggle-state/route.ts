import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { toggleStateCoupon } from '@/server/services/coupon-service.js';

// GET /api/coupons/:id

async function toggleStateCouponAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return toggleStateCoupon(id, body);
}

export const { GET, PUT, DELETE } = errorHandler({
	BATCH: toggleStateCouponAction,
});

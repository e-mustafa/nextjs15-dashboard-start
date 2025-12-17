import { HandlerContext, errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { toggleStateDiscount } from '@/server/services/discount-service';

// GET /api/discounts/:id

async function toggleStateDiscountAction(req: Request, ctx?: HandlerContext) {
	const { id } = (await ctx?.params) ?? {};
	if (!id) throw new AppError('api.errors.invalid_id', 400);
	const body = await req.json();
	return toggleStateDiscount(id, body);
}

export const { GET, PUT, DELETE } = errorHandler({
	BATCH: toggleStateDiscountAction,
});

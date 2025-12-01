import { DiscountType } from '@prisma/client';

export function calculateDiscountedPrice({
	basePrice,
	type,
	value,
	minDiscountValue,
	maxDiscountValue,
}: {
	basePrice: number;
	type: DiscountType;
	value: number; // percentage or fixed value
	minDiscountValue?: number | null;
	maxDiscountValue?: number | null;
}) {
	if (value <= 0) return { discountApplied: 0, finalPrice: basePrice };
	// 1. Calculate the discount amount before the min/max bounds
	let initialDiscount = type === DiscountType.FIXED ? value : (basePrice * value) / 100;

	// 2. Apply min constraints if provided
	if (minDiscountValue && minDiscountValue > 0) {
		initialDiscount = Math.max(initialDiscount, minDiscountValue);
	}

	// 3. Apply max constraints if provided
	if (maxDiscountValue && maxDiscountValue > 0) {
		initialDiscount = Math.min(initialDiscount, maxDiscountValue);
	}

	// 4. Calculate the final price
	const finalPrice = Math.max(0, basePrice - initialDiscount);

	return {
		discountApplied: initialDiscount,
		finalPrice: finalPrice.toFixed(2),
	};
}

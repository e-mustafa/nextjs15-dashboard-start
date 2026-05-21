import { CouponType, DiscountType } from "@prisma/client";

// ✅ Helper type guards
export function isPercentageCoupon(type: CouponType): boolean {
	return type === CouponType.PERCENTAGE;
}

export function isFixedCoupon(type: CouponType): boolean {
	return type === CouponType.FIXED;
}

export function isFreeShippingCoupon(type: CouponType): boolean {
	return type === CouponType.FREE_SHIPPING;
}


/** 🔹 Calculate Coupon Discount */
export function calculateCouponDiscount(
	coupon: {
		type: CouponType;
		value: number;
		maxDiscountAmount?: number | null;
	},
	subtotal: number,
): number {
	if (subtotal <= 0) return 0;

	let discountAmount = 0;

	switch (coupon.type) {
		case CouponType.FIXED:
			discountAmount = coupon.value;
			break;

		case CouponType.PERCENTAGE:
			discountAmount = (subtotal * coupon.value) / 100;
			break;

		case CouponType.FREE_SHIPPING:
			// Free shipping discount is handled separately
			discountAmount = 0;
			break;

		default:
			discountAmount = 0;
	}

	// Apply max discount constraint
	if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
		discountAmount = coupon.maxDiscountAmount;
	}

	// Ensure discount doesn't exceed subtotal
	discountAmount = Math.min(discountAmount, subtotal);

	return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
}


/** 🔹 Calculate Discounted Price */
export function calculateDiscountedPrice(
	basePrice: number,
	discount: {
		type: DiscountType;
		value: number;
		minDiscountValue?: number | null;
		maxDiscountValue?: number | null;
	},
): number {
	if (basePrice <= 0 || discount.value <= 0) return basePrice;

	let discountAmount = 0;

	// Calculate discount amount
	if (discount.type === DiscountType.FIXED) {
		discountAmount = discount.value;
	} else if (discount.type === DiscountType.PERCENTAGE) {
		discountAmount = (basePrice * discount.value) / 100;
	}

	// Apply min constraint (only if > 0)
	if (discount.minDiscountValue && discount.minDiscountValue > 0 && discountAmount < discount.minDiscountValue) {
		discountAmount = discount.minDiscountValue;
	}

	// Apply max constraint (only if > 0)
	if (discount.maxDiscountValue && discount.maxDiscountValue > 0 && discountAmount > discount.maxDiscountValue) {
		discountAmount = discount.maxDiscountValue;
	}

	// Ensure discount doesn't exceed base price
	discountAmount = Math.min(discountAmount, basePrice);

	const finalPrice = Math.max(0, basePrice - discountAmount);
	return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
}
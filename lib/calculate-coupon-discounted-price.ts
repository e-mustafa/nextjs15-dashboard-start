import { CouponType } from "@prisma/client";

export interface MinimalCouponData {
	type: CouponType;
	value: number;
	maxDiscountAmount?: number | null;
}

/**
 * 🔹 حساب الخصم وسعر المنتج النهائي لمنتج واحد منفرد
 */
export function calculateSingleProductDiscount(
	productPrice: number,
	coupon: MinimalCouponData,
): { discountAmount: number; priceAfterDiscount: number } {
	if (productPrice <= 0) return { discountAmount: 0, priceAfterDiscount: 0 };

	let discountAmount = 0;

	switch (coupon.type) {
		case CouponType.FIXED:
			// في الكوبون الثابت، قيمة الكوبون تخصم بالكامل من المنتج في المعاينة
			discountAmount = coupon.value;
			break;

		case CouponType.PERCENTAGE:
			discountAmount = (productPrice * coupon.value) / 100;
			break;

		case CouponType.FREE_SHIPPING:
		default:
			discountAmount = 0; // الشحن المجاني لا يغير سعر المنتج نفسه
	}

	// تطبيق الحد الأقصى للخصم إن وجد
	if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
		discountAmount = coupon.maxDiscountAmount;
	}

	// حماية: الخصم لا يمكن أن يتجاوز سعر المنتج الأصلي
	discountAmount = Math.min(discountAmount, productPrice);

	// تقريب رياضي آمن لخانتين عشريتين
	discountAmount = Math.round(discountAmount * 100) / 100;
	const priceAfterDiscount = Math.round((productPrice - discountAmount) * 100) / 100;

	return {
		discountAmount,
		priceAfterDiscount: Math.max(0, priceAfterDiscount),
	};
}

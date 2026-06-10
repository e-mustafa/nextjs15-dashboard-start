'use server';
import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
import { TCouponFormValues } from '@/validation/coupon-validation';
import {
	applyCoupon,
	createCoupon,
	deleteCoupon,
	deleteManyCoupons,
	getAllCoupons,
	getCoupon,
	getCouponStatistics,
	getUserCouponUsage,
	recordCouponUsage,
	toggleStateCoupon,
	updateCoupon,
	validateCoupon,
} from '../services/coupon-service';
import { ApplyCouponRequest } from '../services/coupon-service/types';

export async function getAllCouponsAction(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData,
) {
	return runAction(() => getAllCoupons(params, locale));
}

export async function getCouponAction(id: string) {
	return runAction(() => getCoupon(id));
}

export async function createCouponAction(data: TCouponFormValues) {
	return runAction(() => createCoupon(data));
}

export async function updateCouponAction(id: string, data: TCouponFormValues) {
	return runAction(() => updateCoupon(id, data));
}

export async function toggleStateCouponAction(id: string, data: boolean) {
	return runAction(() => toggleStateCoupon(id, data ?? false));
}

export async function deleteCouponAction(id: string) {
	return runAction(() => deleteCoupon(id));
}

export async function deleteManyCouponsAction(ids: string[]) {
	return runAction(() => deleteManyCoupons(ids));
}

// -------------------------------------------------------
export async function validateCouponAction(
	code: string,
	userId?: string,
	cartItems?: { productId: string; categoryId?: string; collectionIds?: string[] }[],
	subtotal?: number,
) {
	return runAction(() => validateCoupon(code, userId, cartItems, subtotal));
}

export async function applyCouponAction(request: ApplyCouponRequest, locale?: string) {
	return runAction(() => applyCoupon(request, locale));
}
export async function recordCouponUsageAction(
	couponCode: string,
	userId: string | null,
	orderId: string,
	discountAmount: number,
) {
	return runAction(() => recordCouponUsage(couponCode, userId, orderId, discountAmount));
}

export async function getCouponStatisticsAction() {
	return runAction(() => getCouponStatistics());
}

export async function getUserCouponUsageAction(userId: string, couponId: string) {
	return runAction(() => getUserCouponUsage(userId, couponId));
}

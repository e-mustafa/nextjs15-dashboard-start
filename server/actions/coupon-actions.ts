'use server';
import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
import { TCouponFormValues } from '@/validation/coupon-validation';
import {
	createCoupon,
	deleteCoupon,
	deleteManyCoupons,
	getAllCoupons,
	getCoupon,
	toggleStateCoupon,
	updateCoupon,
} from '../services/coupon-service';

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

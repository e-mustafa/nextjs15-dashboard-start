'use server';
import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
import { TDiscountFormValues } from '@/validation/discount-validation';
import {
	createDiscount,
	deleteDiscount,
	deleteManyDiscounts,
	getAllDiscounts,
	getDiscount,
	toggleStateDiscount,
	updateDiscount,
} from '../services/discount-service';

export async function getAllDiscountsAction(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
) {
	return runAction(() => getAllDiscounts(params, locale));
}

export async function getDiscountAction(id: string) {
	return runAction(() => getDiscount(id));
}

export async function createDiscountAction(data: TDiscountFormValues) {
	return runAction(() => createDiscount(data));
}

export async function updateDiscountAction(id: string, data: TDiscountFormValues) {
	return runAction(() => updateDiscount(id, data));
}

export async function toggleStateDiscountAction(id: string, data: boolean) {
	return runAction(() => toggleStateDiscount(id, data ?? false));
}

export async function deleteDiscountAction(id: string) {
	return runAction(() => deleteDiscount(id));
}

export async function deleteManyDiscountsAction(ids: string[]) {
	return runAction(() => deleteManyDiscounts(ids));
}

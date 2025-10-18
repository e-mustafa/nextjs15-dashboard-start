'use server';

import { TBrandFormValues } from '@/components/Dashboard/forms/brand-form';
import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
import * as brandService from '@/server/services/brand-service';

// export async function getAllBrandsAction() {
// 	return runAction(() => brandService.getAllBrands());
// }

export async function getAllBrandsAction(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
) {
	return runAction(() => brandService.getAllBrands(params, locale));
}

export async function getBrandAction(id: string) {
	return runAction(() => brandService.getBrand(id));
}

export async function createBrandAction(data: TBrandFormValues) {
	return runAction(() => brandService.createBrand(data));
}

export async function updateBrandAction(id: string, data: TBrandFormValues) {
	return runAction(() => brandService.updateBrand(id, data));
}

export async function deleteBrandAction(id: string) {
	return runAction(() => brandService.deleteBrand(id));
}

export async function deleteManyBrandsAction(ids: string[]) {
	return runAction(() => brandService.deleteManyBrands(ids));
}

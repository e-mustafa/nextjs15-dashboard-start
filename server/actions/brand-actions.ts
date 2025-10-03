'use server';

import { TBrandFormValues } from '@/components/Dashboard/forms/brand-form';
import { runAction } from '@/lib/server/error-handler/errorsApp';
import * as brandService from '@/lib/services/brandService';

export async function getAllBrandsAction() {
	return runAction(() => brandService.getAllBrands());
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

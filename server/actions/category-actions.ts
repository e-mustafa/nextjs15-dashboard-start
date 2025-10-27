'use server';

import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
import * as categoryService from '@/server/services/category-service';
import { TCategoryFormValues } from '@/validation/category-validation';

export async function getAllCategoriesAction(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
) {
	return runAction(() => categoryService.getAllCategories(params, locale));
}

export async function getCategoryAction(id: string) {
	return runAction(() => categoryService.getCategory(id));
}

export async function createCategoryAction(data: TCategoryFormValues) {
	return runAction(() => categoryService.createCategory(data));
}

export async function updateCategoryAction(id: string, data: TCategoryFormValues) {
	return runAction(() => categoryService.updateCategory(id, data));
}

export async function toggleStateCategoryAction(id: string, data: boolean) {
	return runAction(() => categoryService.toggleStateCategory(id, data ?? false));
}

export async function deleteCategoryAction(id: string) {
	return runAction(() => categoryService.deleteCategory(id));
}

export async function deleteManyCategoriesAction(ids: string[]) {
	return runAction(() => categoryService.deleteManyCategories(ids));
}

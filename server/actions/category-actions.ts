'use server';

import { TTypeFormValues } from '@/components/Dashboard/forms/category-form';
import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
import * as categoryService from '@/server/services/category-service';

// export async function getAllCategoriesAction() {
// 	return runAction(() => categoryService.getAllCategories());
// }

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

export async function createCategoryAction(data: TTypeFormValues) {
	return runAction(() => categoryService.createCategory(data));
}

export async function updateCategoryAction(id: string, data: TTypeFormValues) {
	return runAction(() => categoryService.updateCategory(id, data));
}

export async function deleteCategoryAction(id: string) {
	return runAction(() => categoryService.deleteCategory(id));
}

export async function deleteManyCategoriesAction(ids: string[]) {
	return runAction(() => categoryService.deleteManyCategories(ids));
}

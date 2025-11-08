'use server';

import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
import * as tagService from '@/server/services/tag-service';
import { TTagFormValues } from '@/validation/tag-validation';

// export async function getAllTagsAction() {
// 	return runAction(() => tagService.getAllTags());
// }

export async function getAllTagsAction(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
) {
	return runAction(() => tagService.getAllTags(params));
}

// export async function getTagAction(id: string) {
// 	return runAction(() => tagService.getTag(id));
// }

export async function createTagAction(data: TTagFormValues) {
	return runAction(() => tagService.createTag(data));
}

// export async function updateTagAction(id: string, data: TTagFormValues) {
// 	return runAction(() => tagService.updateTag(id, data));
// }

// export async function toggleStateTagAction(id: string, data: boolean) {
// 	return runAction(() => tagService.toggleStateTag(id, data ?? false));
// }

export async function deleteTagAction(id: string) {
	return runAction(() => tagService.deleteTag(id));
}

// export async function deleteManyTagsAction(ids: string[]) {
// 	return runAction(() => tagService.deleteManyTags(ids));
// }

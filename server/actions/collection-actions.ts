'use server';

import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
import * as collectionService from '@/server/services/collection-service';
import { TCollectionFormValues } from '@/validation/collection-validation';

// export async function getAllCollectionsAction() {
// 	return runAction(() => collectionService.getAllCollections());
// }

export async function getAllCollectionsAction(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
) {
	return runAction(() => collectionService.getAllCollections(params, locale));
}

export async function getCollectionAction(id: string) {
	return runAction(() => collectionService.getCollection(id));
}

export async function createCollectionAction(data: TCollectionFormValues) {
	return runAction(() => collectionService.createCollection(data));
}

export async function updateCollectionAction(id: string, data: TCollectionFormValues) {
	return runAction(() => collectionService.updateCollection(id, data));
}

export async function toggleStateCollectionAction(id: string, data: boolean) {
	return runAction(() => collectionService.toggleStateCollection(id, data ?? false));
}

export async function deleteCollectionAction(id: string) {
	return runAction(() => collectionService.deleteCollection(id));
}

export async function deleteManyCollectionsAction(ids: string[]) {
	return runAction(() => collectionService.deleteManyCollections(ids));
}

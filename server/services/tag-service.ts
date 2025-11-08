import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { AttributeType, Prisma } from '@prisma/client';
import { revalidateTag } from 'next/cache';

// ============================================
// TAG SERVICE
// ============================================

export type TTagFormValues = {
	id?: string;
	name: string;
	slug: string;
	createAt?: Date | string;
};

/**
 * 📋 Get all tags
 */
export async function getAllTags(params?: { page?: number; limit?: number; search?: string }): Promise<ActionResult<any>> {
	const page = Number(params?.page) || 1;
	const limit = Number(params?.limit) || 50;
	const search = params?.search?.trim() || '';
	const skip = (page - 1) * limit;

	const where: Prisma.TagWhereInput = search
		? {
				OR: [
					{ name: { contains: search, mode: Prisma.QueryMode.insensitive } },
					{ slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
				],
		  }
		: {};

	const [tags, total] = await Promise.all([
		prisma_DB.tag.findMany({
			where,
			skip,
			take: limit,
			orderBy: { name: 'asc' },
		}),
		prisma_DB.tag.count({ where }),
	]);

	return {
		success: true,
		status: 200,
		data: tags,
		meta: {
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		},
	};
}

/**
 * 🔍 Get single tag
 */
// export async function getTag(id: string): Promise<ActionResult<any>> {
// 	if (!id) throw new AppError('api.errors.invalid_id', 404);

// 	const tag = await prisma_DB.tag.findUnique({ where: { id } });
// 	if (!tag) throw new AppError('api.tags.errors.not_found', 404);

// 	return {
// 		success: true,
// 		status: 200,
// 		data: tag,
// 	};
// }

/**
 * 🟢 Create tag
 */
export async function createTag(data: TTagFormValues): Promise<ActionResult<TTagFormValues>> {
	const { name, slug } = data;

	// Check uniqueness
	const [existingName, existingSlug] = await Promise.all([
		prisma_DB.tag.findFirst({ where: { name } }),
		prisma_DB.tag.findFirst({ where: { slug } }),
	]);

	if (existingName) {
		return {
			success: false,
			status: 400,
			form_errors: JSON.stringify({ name: ['api.errors.name_exists'] }),
			error: 'api.errors.inputs_validation',
		};
	}

	if (existingSlug) {
		return {
			success: false,
			status: 400,
			form_errors: JSON.stringify({ slug: ['api.errors.slug_exists'] }),
			error: 'api.errors.inputs_validation',
		};
	}

	const tag = await prisma_DB.tag.create({
		data: { name, slug },
	});

	if (!tag) throw new AppError('api.tags.errors.create', 500);

	revalidateTag('tags', 'max');
	logger.info(`✅ Tag created: ${tag.id}`, { context: 'TagService' });

	return {
		success: true,
		status: 201,
		data: tag,
		message: 'api.tags.success.create',
	};
}

/**
 * 🟡 Update tag
 */
// export async function updateSingleTag(id: string, data: TTagFormValues): Promise<ActionResult<any>> {
// 	if (!id) throw new AppError('api.errors.invalid_id', 404);

// 	const { name, slug } = data;

// 	// Check uniqueness
// 	const [existingName, existingSlug] = await Promise.all([
// 		prisma_DB.tag.findFirst({ where: { name, NOT: { id } } }),
// 		prisma_DB.tag.findFirst({ where: { slug, NOT: { id } } }),
// 	]);

// 	if (existingName) {
// 		return {
// 			success: false,
// 			status: 400,
// 			form_errors: JSON.stringify({ name: ['api.errors.name_exists'] }),
// 			error: 'api.errors.inputs_validation',
// 		};
// 	}

// 	if (existingSlug) {
// 		return {
// 			success: false,
// 			status: 400,
// 			form_errors: JSON.stringify({ slug: ['api.errors.slug_exists'] }),
// 			error: 'api.errors.inputs_validation',
// 		};
// 	}

// 	const tag = await prisma_DB.tag.update({
// 		where: { id },
// 		data: { name, slug },
// 	});

// 	revalidateTag('tags', 'max');
// 	logger.info(`✅ Tag updated: ${id}`, { context: 'TagService' });

// 	return {
// 		success: true,
// 		status: 200,
// 		data: tag,
// 		message: 'api.tags.success.update',
// 	};
// }

/**
 * 🔴 Delete tag
 */
export async function deleteTag(id: string): Promise<ActionResult<null>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	await prisma_DB.tag.delete({ where: { id } });

	revalidateTag('tags', 'max');
	logger.info(`✅ Tag deleted: ${id}`, { context: 'TagService' });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.tags.success.delete',
	};
}

/**
 * 🔴 Delete multiple tags
 */
// export async function deleteManyTags(ids: string[]): Promise<ActionResult<null>> {
// 	if (!ids || !Array.isArray(ids)) throw new AppError('api.errors.invalid_ids', 400);
// 	if (!ids.length) throw new AppError('api.errors.empty_ids', 400);

// 	const deleted = await prisma_DB.tag.deleteMany({ where: { id: { in: ids } } });

// 	revalidateTag('tags', 'max');
// 	logger.info(`✅ Tags deleted: ${deleted.count} items`, { context: 'TagService' });

// 	return {
// 		success: true,
// 		status: 200,
// 		data: null,
// 		message: 'api.tags.success.delete_many',
// 	};
// }

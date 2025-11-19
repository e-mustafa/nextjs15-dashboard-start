// Attribute created: ${attributeId}, { context: 'AttributeService' });

import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { AttributeType } from '@prisma/client';
import { revalidateTag, updateTag } from 'next/cache';

// ============================================
// ATTRIBUTE SERVICE
// ============================================

export type TAttributeFormValues = {
	id?: string;
	type: AttributeType;
	name_ar: string;
	name_en: string;
	sortOrder?: number;
	values?: {
		id?: string;
		value: string;
		name_ar: string;
		name_en: string;
		colorHex?: string;
		sortOrder?: number;
	}[];
};

/**
 * 📋 Get all attributes with values
 */
export async function getAllAttributes(locale?: TLocalesData): Promise<ActionResult<any>> {
	const attributes = await prisma_DB.attribute.findMany({
		include: {
			translations: true,
			values: {
				include: { translations: true },
				orderBy: { sortOrder: 'asc' },
			},
		},
		orderBy: { sortOrder: 'asc' },
	});

	const data = await Promise.all(
		attributes.map(async (attr) => {
			const attrTranslation = await mapTranslations(attr.translations, {
				accept_language: locale,
				fields: ['name'],
			});

			const values = await Promise.all(
				attr.values.map(async (val) => {
					const valTranslation = await mapTranslations(val.translations, {
						accept_language: locale,
						fields: ['name'],
					});

					return {
						id: val.id,
						value: val.value,
						colorHex: val.colorHex,
						sortOrder: val.sortOrder,
						...(valTranslation as any),
					};
				})
			);

			return {
				id: attr.id,
				type: attr.type,
				sortOrder: attr.sortOrder,
				values,
				...(attrTranslation as any),
			};
		})
	);

	return {
		success: true,
		status: 200,
		data,
	};
}

/**
 * 🔍 Get single attribute
 */
export async function getAttribute(id: string, locale?: TLocalesData): Promise<ActionResult<any>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const attribute = await prisma_DB.attribute.findUnique({
		where: { id },
		include: {
			translations: true,
			values: {
				include: { translations: true },
				orderBy: { sortOrder: 'asc' },
			},
		},
	});

	if (!attribute) throw new AppError('api.attributes.errors.not_found', 404);

	const attrTranslation = await mapTranslations(attribute.translations, {
		accept_language: locale,
		fields: ['name'],
	});

	const values = await Promise.all(
		attribute.values.map(async (val) => {
			const valTranslation = await mapTranslations(val.translations, {
				accept_language: locale,
				fields: ['name'],
			});

			return {
				id: val.id,
				value: val.value,
				colorHex: val.colorHex,
				sortOrder: val.sortOrder,
				...(valTranslation as any),
			};
		})
	);

	return {
		success: true,
		status: 200,
		data: {
			id: attribute.id,
			type: attribute.type,
			sortOrder: attribute.sortOrder,
			values,
			...(attrTranslation as any),
		},
	};
}

/**
 * 🟢 Create new attribute with values
 */
export async function createAttribute(data: TAttributeFormValues): Promise<ActionResult<any>> {
	const { type, name_ar, name_en, sortOrder = 0, values = [] } = data;

	const attributeId = await prisma_DB.$transaction(
		async (tx) => {
			// Create attribute
			const attribute = await tx.attribute.create({
				data: { type, sortOrder },
			});

			// Create translations
			await Promise.all([
				tx.attributeTranslation.create({
					data: {
						attributeId: attribute.id,
						lang: 'ar',
						name: name_ar,
					},
				}),
				tx.attributeTranslation.create({
					data: {
						attributeId: attribute.id,
						lang: 'en',
						name: name_en,
					},
				}),
			]);

			// Create values if provided
			if (values.length) {
				await Promise.all(
					values.map(async (val, index) => {
						const attributeValue = await tx.attributeValue.create({
							data: {
								attributeId: attribute.id,
								value: val.value,
								colorHex: val.colorHex,
								sortOrder: val.sortOrder ?? index,
							},
						});

						// Create value translations
						await Promise.all([
							tx.attributeValueTranslation.create({
								data: {
									attributeValueId: attributeValue.id,
									lang: 'ar',
									name: val.name_ar,
								},
							}),
							tx.attributeValueTranslation.create({
								data: {
									attributeValueId: attributeValue.id,
									lang: 'en',
									name: val.name_en,
								},
							}),
						]);
					})
				);
			}

			return attribute.id;
		},
		{ timeout: 10000 }
	);

	revalidateTag('attributes', 'max');
	logger.info(`✅ Attribute value deleted: ${attributeId}`, { context: 'AttributeService' });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.attributes.success.value_deleted',
	};
}

/**
 * 🟡 Update attribute
 */
export async function updateAttribute(id: string, data: TAttributeFormValues): Promise<ActionResult<TAttributeFormValues>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	const { type, name_ar, name_en, sortOrder, values } = data;

	await prisma_DB.$transaction(
		async (tx) => {
			// Update attribute
			await tx.attribute.update({
				where: { id },
				data: {
					...(type ? { type } : {}),
					...(sortOrder !== undefined ? { sortOrder } : {}),
				},
			});

			// Update translations
			if (name_ar || name_en) {
				await Promise.all([
					name_ar
						? tx.attributeTranslation.upsert({
								where: { attributeId_lang: { attributeId: id, lang: 'ar' } },
								update: { name: name_ar },
								create: { attributeId: id, lang: 'ar', name: name_ar },
						  })
						: Promise.resolve(),
					name_en
						? tx.attributeTranslation.upsert({
								where: { attributeId_lang: { attributeId: id, lang: 'en' } },
								update: { name: name_en },
								create: { attributeId: id, lang: 'en', name: name_en },
						  })
						: Promise.resolve(),
				]);
			}

			// Update values if provided
			if (values) {
				// Get existing values
				const existingValues = await tx.attributeValue.findMany({
					where: { attributeId: id },
					select: { id: true },
				});

				const existingIds = existingValues.map((v) => v.id);
				const providedIds = values.filter((v) => v.id).map((v) => v.id!);

				// Delete removed values
				const toDelete = existingIds.filter((id) => !providedIds.includes(id));
				if (toDelete.length) {
					await tx.attributeValue.deleteMany({
						where: { id: { in: toDelete } },
					});
				}

				// Update or create values
				await Promise.all(
					values.map(async (val, index) => {
						if (val.id) {
							// Update existing value
							await tx.attributeValue.update({
								where: { id: val.id },
								data: {
									value: val.value,
									colorHex: val.colorHex,
									sortOrder: val.sortOrder ?? index,
								},
							});

							// Update translations
							await Promise.all([
								tx.attributeValueTranslation.upsert({
									where: { attributeValueId_lang: { attributeValueId: val.id, lang: 'ar' } },
									update: { name: val.name_ar },
									create: { attributeValueId: val.id, lang: 'ar', name: val.name_ar },
								}),
								tx.attributeValueTranslation.upsert({
									where: { attributeValueId_lang: { attributeValueId: val.id, lang: 'en' } },
									update: { name: val.name_en },
									create: { attributeValueId: val.id, lang: 'en', name: val.name_en },
								}),
							]);
						} else {
							// Create new value
							const attributeValue = await tx.attributeValue.create({
								data: {
									attributeId: id,
									value: val.value,
									colorHex: val.colorHex,
									sortOrder: val.sortOrder ?? index,
								},
							});

							// Create translations
							await Promise.all([
								tx.attributeValueTranslation.create({
									data: {
										attributeValueId: attributeValue.id,
										lang: 'ar',
										name: val.name_ar,
									},
								}),
								tx.attributeValueTranslation.create({
									data: {
										attributeValueId: attributeValue.id,
										lang: 'en',
										name: val.name_en,
									},
								}),
							]);
						}
					})
				);
			}
		},
		{ timeout: 10000 }
	);

	revalidateTag('attributes', 'max');
	logger.info(`✅ Attribute updated: ${id}`, { context: 'AttributeService' });

	const attribute = await getAttribute(id);
	return {
		success: true,
		status: 200,
		data: attribute.data,
		message: 'api.attributes.success.update',
	};
}

/**
 * 🔴 Delete attribute
 */
export async function deleteAttribute(id: string): Promise<ActionResult<null>> {
	if (!id) throw new AppError('api.errors.invalid_id', 404);

	// Check if attribute is used in any products or variants
	const [productCount, variantCount] = await Promise.all([
		prisma_DB.productAttribute.count({ where: { attributeId: id } }),
		prisma_DB.variantOption.count({ where: { attributeId: id } }),
	]);

	if (productCount > 0 || variantCount > 0) {
		return {
			success: false,
			status: 400,
			error: 'api.attributes.errors.in_use',
		};
	}

	await prisma_DB.attribute.delete({ where: { id } });

	revalidateTag('attributes', 'max');
	logger.info(`✅ Attribute deleted: ${id}`, { context: 'AttributeService' });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.attributes.success.delete',
	};
}

/**
 * ➕ Add attribute value to existing attribute
 */
export async function addAttributeValue(
	attributeId: string,
	valueData: {
		value: string;
		name_ar: string;
		name_en: string;
		colorHex?: string;
		sortOrder?: number;
	}
): Promise<ActionResult<any>> {
	if (!attributeId) throw new AppError('api.errors.invalid_id', 404);

	const attribute = await prisma_DB.attribute.findUnique({ where: { id: attributeId } });
	if (!attribute) throw new AppError('api.attributes.errors.not_found', 404);

	const valueId = await prisma_DB.$transaction(async (tx) => {
		const attributeValue = await tx.attributeValue.create({
			data: {
				attributeId,
				value: valueData.value,
				colorHex: valueData.colorHex,
				sortOrder: valueData.sortOrder ?? 0,
			},
		});

		await Promise.all([
			tx.attributeValueTranslation.create({
				data: {
					attributeValueId: attributeValue.id,
					lang: 'ar',
					name: valueData.name_ar,
				},
			}),
			tx.attributeValueTranslation.create({
				data: {
					attributeValueId: attributeValue.id,
					lang: 'en',
					name: valueData.name_en,
				},
			}),
		]);

		return attributeValue.id;
	});

	revalidateTag('attributes', 'max');
	logger.info(`✅ Attribute value added: ${valueId}`, { context: 'AttributeService' });

	return {
		success: true,
		status: 201,
		data: { id: valueId },
		message: 'api.attributes.success.value_added',
	};
}

/**
 * 🔴 Delete attribute value
 */
export async function deleteAttributeValue(valueId: string): Promise<ActionResult<null>> {
	if (!valueId) throw new AppError('api.errors.invalid_id', 404);

	// Check if value is used
	const [productCount, variantCount] = await Promise.all([
		prisma_DB.productAttribute.count({ where: { attributeValueId: valueId } }),
		prisma_DB.variantOption.count({ where: { attributeValueId: valueId } }),
	]);

	if (productCount > 0 || variantCount > 0) {
		return {
			success: false,
			status: 400,
			error: 'api.attributes.errors.value_in_use',
		};
	}

	await prisma_DB.attributeValue.delete({ where: { id: valueId } });

	revalidateTag('attributes', 'max');
	logger.info(`✅ Attribute value deleted: ${valueId}`, { context: 'AttributeService' });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.attributes.success.value_deleted',
	};
}

'use server';
import { TLocalesData } from '@/configs/general';
import { AppError } from '@/lib/error-handler/error-handler.server';
import { logger } from '@/lib/logs/logger';
import { mapTranslations } from '@/lib/utils.server/mapTranslations.server';
import { prisma_DB } from '@/prisma/prisma.db';
import { ActionResult } from '@/types/api';
import { AttributeType, Prisma } from '@prisma/client';
import { revalidateTag, updateTag } from 'next/cache';



// ============================================
// VARIANT GENERATION HELPER
// ============================================

/**
 * 🎨 Generate all possible variants from attributes
 * Example: If you have Color (Red, Blue) and Size (S, M, L)
 * It will generate 6 variants: Red-S, Red-M, Red-L, Blue-S, Blue-M, Blue-L
 */
export async function generateProductVariants(
	productId: string,
	attributes: {
		attributeId: string;
		valueIds: string[];
	}[],
	baseData?: {
		price?: number;
		compareAtPrice?: number;
		cost?: number;
		stockQuantity?: number;
	}
): Promise<ActionResult<{ created: number; variants: any[] }>> {
	if (!productId) throw new AppError('api.errors.invalid_id', 404);
	if (!attributes.length) throw new AppError('api.errors.no_attributes', 400);

	const product = await prisma_DB.product.findUnique({ where: { id: productId } });
	if (!product) throw new AppError('api.products.errors.not_found', 404);

	// Generate all combinations
	const combinations = generateCombinations(attributes);

	// Create variants
	const variants = await prisma_DB.$transaction(
		async (tx) => {
			const createdVariants = [];

			for (const [index, combination] of combinations.entries()) {
				// Generate SKU
				const sku = `${product.sku}-${index + 1}`;

				// Check if SKU exists
				const existing = await tx.productVariant.findUnique({ where: { sku } });
				if (existing) continue;

				// Create variant
				const variant = await tx.productVariant.create({
					data: {
						productId,
						sku,
						price: baseData?.price ?? product.basePrice,
						compareAtPrice: baseData?.compareAtPrice ?? product.compareAtPrice,
						cost: baseData?.cost ?? product.cost,
						stockQuantity: baseData?.stockQuantity ?? 0,
						sortOrder: index,
					},
				});

				// Create variant options
				await Promise.all(
					combination.map((option) =>
						tx.variantOption.create({
							data: {
								variantId: variant.id,
								attributeId: option.attributeId,
								attributeValueId: option.valueId,
							},
						})
					)
				);

				createdVariants.push(variant);
			}

			return createdVariants;
		},
		{ timeout: 30000 }
	);

	revalidateTag('products', 'max');
	logger.info(`✅ Generated ${variants.length} variants for product: ${productId}`, {
		context: 'AttributeService',
	});

	return {
		success: true,
		status: 201,
		data: {
			created: variants.length,
			variants: variants.map((v) => ({ id: v.id, sku: v.sku })),
		},
		message: 'api.products.success.variants_generated',
	};
}

/**
 * Helper to generate all combinations
 */
function generateCombinations(
	attributes: { attributeId: string; valueIds: string[] }[]
): { attributeId: string; valueId: string }[][] {
	if (attributes.length === 0) return [[]];

	const [first, ...rest] = attributes;
	const restCombinations = generateCombinations(rest);

	const combinations: { attributeId: string; valueId: string }[][] = [];

	for (const valueId of first.valueIds) {
		for (const restCombination of restCombinations) {
			combinations.push([{ attributeId: first.attributeId, valueId }, ...restCombination]);
		}
	}

	return combinations;
}

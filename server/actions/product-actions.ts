'use server';

import { TLocalesData } from '@/configs/general';
import { runAction } from '@/lib/error-handler/error-handler.server';
// import * as productService from '@/server/services/product-service';
import { TProductFormValues } from '@/validation/product-validation';
import {
	bulkUpdateProductStatus,
	checkSkuAvailability,
	checkSlugAvailability,
	createProduct,
	deleteManyProducts,
	deleteProduct,
	getAllProducts,
	getFeaturedProducts,
	getProduct,
	getProductStockStatus,
	getRelatedProducts,
	toggleFeaturedProduct,
	toggleStateProduct,
	updateProduct,
	updateProductStock,
} from '../services/product-service';

/**
 * Get all products with pagination and filters
 */
export async function getAllProductsAction(
	params?: {
		page?: number;
		limit?: number;
		search?: string;
		brandId?: string;
		categoryId?: string;
		collectionId?: string;
		isActive?: boolean;
		isFeatured?: boolean;
		inStock?: boolean;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	},
	locale?: TLocalesData
) {
	return runAction(() => getAllProducts(params, locale));
}

/**
 * Get single product by ID, SKU, or Slug
 */
export async function getProductAction(identifier: string, locale?: TLocalesData) {
	return runAction(() => getProduct(identifier, locale));
}

/**
 * Create new product
 */
export async function createProductAction(data: TProductFormValues) {
	return runAction(() => createProduct(data));
}

/**
 * Update existing product
 */
export async function updateProductAction(id: string, data: TProductFormValues) {
	return runAction(() => updateProduct(id, data));
}

/**
 * Toggle product active status
 */
export async function toggleStateProductAction(id: string, isActive: boolean) {
	return runAction(() => toggleStateProduct(id, isActive));
}

/**
 * Toggle product featured status
 */
export async function toggleFeaturedProductAction(id: string, isFeatured: boolean) {
	return runAction(() => toggleFeaturedProduct(id, isFeatured));
}

/**
 * Delete single product
 */
export async function deleteProductAction(id: string) {
	return runAction(() => deleteProduct(id));
}

/**
 * Delete multiple products
 */
export async function deleteManyProductsAction(ids: string[]) {
	return runAction(() => deleteManyProducts(ids));
}

/**
 * Update product stock
 */
export async function updateProductStockAction(id: string, quantity: number, operation?: 'add' | 'subtract' | 'set') {
	return runAction(() => updateProductStock(id, quantity, operation));
}

/**
 * Bulk update product status
 */
export async function bulkUpdateProductStatusAction(ids: string[], isActive: boolean) {
	return runAction(() => bulkUpdateProductStatus(ids, isActive));
}

/**
 * Get featured products
 */
export async function getFeaturedProductsAction(limit?: number, locale?: TLocalesData) {
	return runAction(() => getFeaturedProducts(limit, locale));
}

/**
 * Get related products
 */
export async function getRelatedProductsAction(productId: string, limit?: number, locale?: TLocalesData) {
	return runAction(() => getRelatedProducts(productId, limit, locale));
}

/**
 * Get product stock status
 */
export async function getProductStockStatusAction(id: string) {
	return runAction(() => getProductStockStatus(id));
}

/**
 * Check SKU availability
 */
export async function checkSkuAvailabilityAction(sku: string, excludeId?: string) {
	return runAction(() => checkSkuAvailability(sku, excludeId));
}

/**
 * Check slug availability
 */
export async function checkSlugAvailabilityAction(slug: string, lang: 'ar' | 'en', excludeProductId?: string) {
	return runAction(() => checkSlugAvailability(slug, lang, excludeProductId));
}

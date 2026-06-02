import { CouponApplicableOn, CouponType, Prisma } from '@prisma/client';
import { couponWithRelationsInclude } from './prisma-includes.js';

// ✅ Updated Types with Translations
export type CouponWithRelations = Prisma.CouponGetPayload<{
	include: typeof couponWithRelationsInclude;
}>;

export interface CouponProduct {
	id: string;
	name: string;
	basePrice: number;
	image?: string;
}

export interface CouponCategory {
	id: string;
	name: string;
	image?: string;
}

export interface CouponCollection {
	id: string;
	name: string;
	image?: string;
}

export interface FormattedCoupon {
	id: string;
	code: string;
	name: string;
	description?: string;
	type: CouponType;
	value: number;
	applicableOn: CouponApplicableOn;
	minPurchaseAmount: number | null;
	maxDiscountAmount: number | null;
	usageLimit: number | null;
	usagePerUser: number | null;
	usedCount: number;
	remainingUses: number | null;
	startDate: string;
	endDate: string | null;
	isActive: boolean;
	isPublic: boolean;
	isValid: boolean;
	isExpired: boolean;
	totalProducts: number;
	totalCategories: number;
	totalCollections: number;
	createdAt: string;
	updatedAt: string;
	products: string[];
	categories: string[];
	collections: string[];
}

export interface CouponValidation {
	isValid: boolean;
	message?: string;
	discount?: number;
	finalAmount?: number;
	errors?: string[];
}

export interface ApplyCouponRequest {
	couponCode: string;
	userId?: string;
	cartItems: { productId: string; categoryId?: string; collectionIds?: string[] }[];
	subtotal: number;
}

export interface CouponStatistics {
	totalCoupons: number;
	activeCoupons: number;
	expiredCoupons: number;
	totalUsages: number;
	totalDiscount: number;
	averageDiscountPerUse: number;
	mostUsedCoupon: { code: string; usages: number } | undefined;
}

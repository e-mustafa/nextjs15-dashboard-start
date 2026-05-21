import { msg } from '@/lib/utils';
import { CouponApplicableOn, CouponType } from '@prisma/client';
import { z } from 'zod';
import { integerPositiveNumber, nameArField, nameEnField, preprocessNumber } from './fields-validation';
// import { CouponType, EnumCouponApplicableOn } from '@prisma/client';

export const EnumCouponTypes = CouponType || {
	FIXED: 'FIXED' as const,
	PERCENTAGE: 'PERCENTAGE' as const,
	FREE_SHIPPING: 'FREE_SHIPPING' as const,
};

export const EnumCouponApplicableOn = CouponApplicableOn || {
	ALL_PRODUCTS: 'ALL_PRODUCTS' as const,
	SPECIFIC_PRODUCTS: 'SPECIFIC_PRODUCTS' as const,
	SPECIFIC_CATEGORIES: 'SPECIFIC_CATEGORIES' as const,
	SPECIFIC_COLLECTIONS: 'SPECIFIC_COLLECTIONS' as const,
	MINIMUM_PURCHASE: 'MINIMUM_PURCHASE' as const,
};
const couponTypes = Object.values(EnumCouponTypes);
const couponApplicableOn = Object.values(EnumCouponApplicableOn);

export const formSchemaCoupon = z
	.object({
		code: z
			.string()
			.min(3, { message: msg('forms.validation.min_length', { min: 3 }) })
			.max(50, { message: msg('forms.validation.max_length', { max: 50 }) })
			// .regex(/^[A-Z0-9_-]+$/, 'forms.validation.invalid_code_format')
			.transform((val) => val.toUpperCase()),
		name_ar: nameArField,
		name_en: nameEnField,
		description_ar: z
			.string()
			.max(1000, { message: msg('forms.validation.max_length', { max: 1000 }) })
			.nullable()
			.optional(),
		description_en: z
			.string()
			.max(1000, { message: msg('forms.validation.max_length', { max: 1000 }) })
			.nullable()
			.optional(),
		type: z.enum(couponTypes!, { message: 'forms.validation.required' }),
		value: preprocessNumber(
			z.number({ message: msg('forms.validation.integer') }).positive(msg('forms.validation.positive')),
		),
		applicableOn: z.enum(couponApplicableOn!, { message: 'forms.validation.required' }),

		// Arrays for relations
		products: z.array(z.cuid2({ message: 'forms.validation.invalid_id' })),
		categories: z.array(z.cuid2({ message: 'forms.validation.invalid_id' })),
		collections: z.array(z.cuid2({ message: 'forms.validation.invalid_id' })),

		// Constraints
		minPurchaseAmount: integerPositiveNumber.nullable(),
		maxDiscountAmount: integerPositiveNumber.nullable(),
		usageLimit: integerPositiveNumber.nullable().optional(),
		usagePerUser: integerPositiveNumber.nullable().optional(),

		// Dates
		startDate: z.date({ message: 'forms.validation.invalid_date' }),
		endDate: z.date({ message: 'forms.validation.invalid_date' }),
		// .nullable()
		// .optional()
		// .transform((val) => (val === '' ? null : val)),
		// Status
		isActive: z.boolean(),
		isPublic: z.boolean(),
	})
	.refine(
		(data) => {
			// Validate percentage value (must be between 0 and 100)
			if (data.type === EnumCouponTypes.PERCENTAGE) {
				return data.value > 0 && data.value <= 100;
			}
			return true;
		},
		{
			message: 'forms.validation.invalid_percentage',
			path: ['value'],
		},
	)
	.refine(
		(data) => {
			// Free shipping must have value = 0
			if (data.type === EnumCouponTypes.FREE_SHIPPING) {
				return data.value === 0;
			}
			return true;
		},
		{
			message: 'forms.validation.required',
			path: ['value'],
		},
	)
	.refine(
		(data) => {
			// Validate end date is after start date
			if (data.endDate && data.endDate !== null) {
				const start = new Date(data.startDate);
				const end = new Date(data.endDate);
				return end > start;
			}
			return true;
		},
		{
			message: 'forms.validation.end_date_before_start_date',
			path: ['endDate'],
		},
	)
	.refine(
		(data) => {
			// If applicable on specific products, must have products
			if (data.applicableOn === EnumCouponApplicableOn.SPECIFIC_PRODUCTS) {
				return data.products && data.products.length > 0;
			}
			return true;
		},
		{
			message: 'forms.validation.no_products_selected',
			path: ['products'],
		},
	)
	.refine(
		(data) => {
			// If applicable on specific categories, must have categories
			if (data.applicableOn === EnumCouponApplicableOn.SPECIFIC_CATEGORIES) {
				return data.categories && data.categories.length > 0;
			}
			return true;
		},
		{
			message: 'forms.validation.no_categories_selected',
			path: ['categories'],
		},
	)
	.refine(
		(data) => {
			// If applicable on specific collections, must have collections
			if (data.applicableOn === EnumCouponApplicableOn.SPECIFIC_COLLECTIONS) {
				return data.collections && data.collections.length > 0;
			}
			return true;
		},
		{
			message: 'forms.validation.no_collections_selected',
			path: ['collections'],
		},
	)
	.refine(
		(data) => {
			// If minimum purchase, must have minPurchaseAmount
			if (data.applicableOn === EnumCouponApplicableOn.MINIMUM_PURCHASE) {
				return data.minPurchaseAmount !== null && (data.minPurchaseAmount || 0) > 0;
			}
			return true;
		},
		{
			message: 'forms.validation.min_purchase_required',
			path: ['minPurchaseAmount'],
		},
	)
	.refine(
		(data) => {
			// Validate start date is not in the past (allow today and future dates)
			const start = new Date(data.startDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return start >= today;
		},
		{
			message: 'forms.validation.start_date_in_past',
			path: ['startDate'],
		},
	);

// export type TCouponFormValues = z.infer<typeof formSchemaCoupon>;
export type TCouponFormValues = z.infer<typeof formSchemaCoupon> & { id?: string }; // & { id?: string; productId?: string };
// Fields used for translation mapping
export const fields = ['name_ar', 'name_en', 'description_ar', 'description_en'] as const;

// Default values for creating new coupon
// export const defaultValuesCoupon: Partial<TCouponFormValues> = {
export const defaultValuesCoupon = {
	code: '',
	name_ar: '',
	name_en: '',
	description_ar: '',
	description_en: '',
	type: EnumCouponTypes.FIXED,
	value: 0,
	applicableOn: EnumCouponApplicableOn.SPECIFIC_PRODUCTS,
	products: [],
	categories: [],
	collections: [],
	minPurchaseAmount: 0,
	maxDiscountAmount: 0,
	usageLimit: 0,
	usagePerUser: 0,
	startDate: new Date().toISOString(),
	endDate: '',
	isActive: true,
	isPublic: true,
} satisfies TCouponFormValues;

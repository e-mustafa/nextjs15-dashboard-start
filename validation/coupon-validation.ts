import { ComboboxOption } from '@/components/ui-custom/reuseable-combobox';
import { msg } from '@/lib/utils';
import { CouponApplicableOn, CouponType } from '@prisma/client';
import { z } from 'zod';
import {
	dateOptional,
	dateRequired,
	integerPositiveNumber,
	nameArField,
	nameEnField,
	preprocessNumber,
} from './fields-validation';

export const EnumCouponTypes = CouponType || {
	FIXED: 'FIXED',
	PERCENTAGE: 'PERCENTAGE',
	FREE_SHIPPING: 'FREE_SHIPPING',
};

export const EnumCouponApplicableOn = CouponApplicableOn || {
	ALL_PRODUCTS: 'ALL_PRODUCTS',
	SPECIFIC_PRODUCTS: 'SPECIFIC_PRODUCTS',
	SPECIFIC_CATEGORIES: 'SPECIFIC_CATEGORIES',
	SPECIFIC_COLLECTIONS: 'SPECIFIC_COLLECTIONS',
	MINIMUM_PURCHASE: 'MINIMUM_PURCHASE',
};
export interface IInitialItems {
	products?: ComboboxOption['products'] | [];
	categories?: ComboboxOption['categories'] | [];
	collections?: ComboboxOption['collections'] | [];
	brands?: ComboboxOption['brands'] | [];
	tags?: ComboboxOption['tags'] | [];
}

type TCouponFormInput = z.input<typeof formSchemaCoupon> & {
	id?: string;
	initialItems?: IInitialItems;
};


// 2. form output - be sure to return Date object after transform
export type TCouponFormOutput = z.output<typeof formSchemaCoupon>;

export type TCouponFormValues = TCouponFormInput;
export const fields = ['name', 'description'];

// Helper to set endDate 1 month from now by default
const defaultEndDate = new Date();
defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);

export const defaultValuesCoupon: TCouponFormValues = {
	code: '',
	name_ar: '',
	name_en: '',
	description_ar: '',
	description_en: '',
	type: CouponType.FIXED,
	value: 0,
	applicableOn: CouponApplicableOn.ALL_PRODUCTS, // Changed from SPECIFIC_PRODUCTS to avoid immediate validation error
	products: [],
	categories: [],
	collections: [],
	minPurchaseAmount: null, // Null instead of 0 for "No Limit"
	maxDiscountAmount: null,
	usageLimit: null,
	usagePerUser: null,
	startDate: new Date().toISOString(),
	endDate: null, // Fixed the endDate > startDate issue on initial render
	isActive: true,
	isPublic: true,
	initialItems: { products: [], categories: [], collections: [] },
};

export const formSchemaCoupon = z
	.object({
		code: z
			.string()
			.min(3, { message: msg('forms.validation.min_length', { min: 3 }) })
			.max(50, { message: msg('forms.validation.max_length', { max: 50 }) })
			.transform((val) => val.toUpperCase()),
		name_ar: nameArField,
		name_en: nameEnField,
		description_ar: z.string().max(1000).nullable().optional(),
		description_en: z.string().max(1000).nullable().optional(),

		// Using nativeEnum makes it strictly typed with Prisma
		type: z.enum(CouponType, { message: 'forms.validation.required' }),
		value: preprocessNumber(
			z.number({ message: msg('forms.validation.integer') }).nonnegative(msg('forms.validation.positive')), // nonnegative allows 0 for free shipping
		),
		applicableOn: z.enum(CouponApplicableOn, { message: 'forms.validation.required' }),

		// Arrays for relations
		products: z.array(z.cuid2({ message: 'forms.validation.invalid_id' })),
		categories: z.array(z.cuid2({ message: 'forms.validation.invalid_id' })),
		collections: z.array(z.cuid2({ message: 'forms.validation.invalid_id' })),

		// Constraints (Nullable by default represents "No Limit")
		minPurchaseAmount: integerPositiveNumber.nullable().optional(),
		maxDiscountAmount: integerPositiveNumber.nullable().optional(),
		usageLimit: integerPositiveNumber.nullable().optional(),
		usagePerUser: integerPositiveNumber.nullable().optional(),

		startDate: dateRequired,
		endDate: dateOptional,

		isActive: z.boolean().default(true),
		isPublic: z.boolean().default(true),
	})
	.refine(
		(data) => {
			if (data.type === CouponType.PERCENTAGE) return data.value > 0 && data.value <= 100;
			return true;
		},
		{ message: 'forms.validation.invalid_percentage', path: ['value'] },
	)
	.refine(
		(data) => {
			if (data.type === CouponType.FREE_SHIPPING) return data.value === 0;
			return true;
		},
		{ message: 'forms.validation.required', path: ['value'] },
	)
	.refine(
		(data) => {
			// Fixed: Only validate if endDate exists
			if (data.endDate) {
				return data.endDate > data.startDate;
			}
			return true;
		},
		{ message: 'forms.validation.end_date_before_start_date', path: ['endDate'] },
	)
	.refine(
		(data) => {
			if (data.applicableOn === CouponApplicableOn.SPECIFIC_PRODUCTS) return data.products.length > 0;
			return true;
		},
		{ message: 'forms.validation.no_products_selected', path: ['products'] },
	)
	.refine(
		(data) => {
			if (data.applicableOn === CouponApplicableOn.SPECIFIC_CATEGORIES) return data.categories.length > 0;
			return true;
		},
		{ message: 'forms.validation.no_categories_selected', path: ['categories'] },
	)
	.refine(
		(data) => {
			if (data.applicableOn === CouponApplicableOn.SPECIFIC_COLLECTIONS) return data.collections.length > 0;
			return true;
		},
		{ message: 'forms.validation.no_collections_selected', path: ['collections'] },
	)
	.refine(
		(data) => {
			if (data.applicableOn === CouponApplicableOn.MINIMUM_PURCHASE) {
				return data.minPurchaseAmount !== null && data.minPurchaseAmount !== undefined && data.minPurchaseAmount > 0;
			}
			return true;
		},
		{ message: 'forms.validation.min_purchase_required', path: ['minPurchaseAmount'] },
	);

// Notice: I removed the startDate >= today from the main schema.
// Best practice is to check this in the backend controller or a specific "Create" schema wrap,
// so you don't block users from editing old active coupons.

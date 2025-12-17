// import { DiscountType } from '@/constant/enums';
import { DiscountType } from '@prisma/client';
import { msg } from '@/lib/utils';
import z from 'zod';
import { intNotNegativeField, nameArField, nameEnField, preprocessNumber } from './fields-validation';
// import z from 'zod';

export type TDiscountFormValues = z.infer<typeof formSchemaDiscount> & { id?: string, productId?: string};

/** ✅ Unified fields using camelCase naming */
export const fields = [];

export const defaultValuesDiscount = {
	name_ar: '',
	name_en: '',
	type: DiscountType.FIXED,
	value: 0,
	products: [],
	startDate: Date.now().toString(),
	endDate: null,
	isActive: true,
	priority: 0,
	minDiscountValue: null,
	maxDiscountValue: null,
};

export const formSchemaDiscount = z
	.object({
		name_ar: nameArField,
		name_en: nameEnField,
		type: z.enum(DiscountType),
		value: intNotNegativeField,
		startDate: z.string(),
		endDate: z.string().nullable(),

		minDiscountValue: intNotNegativeField.nullable(),
		maxDiscountValue: intNotNegativeField.nullable(),

		isActive: z.boolean(),
		priority: preprocessNumber(z.number({ message: msg('forms.validation.integer') })).optional(),

		products: z.array(z.string()).min(1, { message: msg('forms.validation.at_least_one_product') }),
	})
	.superRefine((data, ctx) => {
		/** 1) percentage must be 1–100 */
		if (data.type === DiscountType.PERCENTAGE) {
			if (data.value <= 0 || data.value > 100) {
				ctx.addIssue({
					path: ['value'],
					code: 'custom',
					message: msg('forms.validation.invalid_percentage_value'),
				});
			}
		}

		/** 2) PERCENTAGE requires min/max, FIXED allows null */
		if (data.type === DiscountType.PERCENTAGE) {
			if (data.minDiscountValue == null) {
				ctx.addIssue({
					path: ['minDiscountValue'],
					code: 'custom',
					message: msg('forms.validation.required'),
				});
			}
			if (data.maxDiscountValue == null) {
				ctx.addIssue({
					path: ['maxDiscountValue'],
					code: 'custom',
					message: msg('forms.validation.required'),
				});
			}
		}

		/** 3) Additional recommended rules */

		// max >= min
		if (
			data.type === DiscountType.PERCENTAGE &&
			data.minDiscountValue != null &&
			data.maxDiscountValue != null &&
			data.maxDiscountValue < data.minDiscountValue
		) {
			ctx.addIssue({
				path: ['maxDiscountValue'],
				code: 'custom',
				message: msg('forms.validation.max_less_than_min'),
			});
		}

		// endDate must be after startDate
		if (data.endDate && data.startDate) {
			const start = new Date(data.startDate).getTime();
			const end = new Date(data.endDate).getTime();
			if (end < start) {
				ctx.addIssue({
					path: ['endDate'],
					code: 'custom',
					message: msg('forms.validation.end_date_before_start_date'),
				});
			}
		}
	});

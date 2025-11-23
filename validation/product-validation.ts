import { msg } from '@/lib/utils';
// import z from 'zod';
import z from 'zod';
import { imagesField, intNotNegativeField, preprocessNumber } from './fields-validation';
import { specificationSectionSchema } from './product-specification-validation';
import { combinationSchema, variantFormSchema } from './product-variant-validation';
import { SEODefaultValues, SEOFormSchema } from './seo-validation';

// export type TProductFormValues = z.output<typeof formSchemaProduct> & { id?: string };
// export type TProductFormValues = z.input<typeof formSchemaProduct> & { id?: string };

export const defaultVariants = [
	{
		id: 'variant-1',
		sku: 'DEFAULT-RED-S',
		price: 0,
		stockQuantity: 0,
		isActive: true,
		options: [
			{
				id: 'opt-1',
				attributeId: 'attr-color',
				attributeValueId: 'val-red',
				attribute: {
					id: 'attr-color',
					type: 'COLOR',
					translations: [
						{ lang: 'ar', name: 'اللون' },
						{ lang: 'en', name: 'Color' },
					],
				},
				attributeValue: {
					id: 'val-red',
					value: 'red',
					colorHex: '#FF0000',
					translations: [
						{ lang: 'ar', name: 'أحمر' },
						{ lang: 'en', name: 'Red' },
					],
				},
			},
			{
				id: 'opt-2',
				attributeId: 'attr-color',
				attributeValueId: 'val-blue',
				attribute: {
					id: 'attr-color',
					type: 'COLOR',
					translations: [
						{ lang: 'ar', name: 'اللون' },
						{ lang: 'en', name: 'Color' },
					],
				},
				attributeValue: {
					id: 'val-blue',
					value: 'blue',
					colorHex: '#0000FF',
					translations: [
						{ lang: 'ar', name: 'ازرق' },
						{ lang: 'en', name: 'blue' },
					],
				},
			},
			{
				id: 'opt-3',
				attributeId: 'attr-size',
				attributeValueId: 'val-s',
				attribute: {
					id: 'attr-size',
					type: 'SIZE',
					translations: [
						{ lang: 'ar', name: 'المقاس' },
						{ lang: 'en', name: 'Size' },
					],
				},
				attributeValue: {
					id: 'val-s',
					value: 'S',
					colorHex: null,
					translations: [
						{ lang: 'ar', name: 'صغير' },
						{ lang: 'en', name: 'Small' },
					],
				},
			},
			{
				id: 'opt-4',
				attributeId: 'attr-size',
				attributeValueId: 'val-m',
				attribute: {
					id: 'attr-size',
					type: 'SIZE',
					translations: [
						{ lang: 'ar', name: 'المقاس' },
						{ lang: 'en', name: 'Size' },
					],
				},
				attributeValue: {
					id: 'val-m',
					value: 'M',
					colorHex: null,
					translations: [
						{ lang: 'ar', name: 'متوسط' },
						{ lang: 'en', name: 'Medium' },
					],
				},
			},
			{
				id: 'opt-5',
				attributeId: 'attr-size',
				attributeValueId: 'val-l',
				attribute: {
					id: 'attr-size',
					type: 'SIZE',
					translations: [
						{ lang: 'ar', name: 'المقاس' },
						{ lang: 'en', name: 'Size' },
					],
				},
				attributeValue: {
					id: 'val-l',
					value: 'L',
					colorHex: null,
					translations: [
						{ lang: 'ar', name: 'كبير' },
						{ lang: 'en', name: 'Large' },
					],
				},
			},
		],
	},
];

export const defaultAttributes = [
	{
		id: 'attr-color',
		type: 'COLOR',
		translations: [
			{ id: 't1', lang: 'ar', name: 'اللون' },
			{ id: 't2', lang: 'en', name: 'Color' },
		],
		values: [
			{
				id: 'val-red',
				value: 'red',
				colorHex: '#FF0000',
				translations: [
					{ id: 'tv1', lang: 'ar', name: 'أحمر' },
					{ id: 'tv2', lang: 'en', name: 'Red' },
				],
			},
			{
				id: 'val-blue',
				value: 'blue',
				colorHex: '#0000FF',
				translations: [
					{ id: 'tv3', lang: 'ar', name: 'أزرق' },
					{ id: 'tv4', lang: 'en', name: 'Blue' },
				],
			},
		],
	},
	{
		id: 'attr-size',
		type: 'SIZE',
		translations: [
			{ id: 't3', lang: 'ar', name: 'المقاس' },
			{ id: 't4', lang: 'en', name: 'Size' },
		],
		values: [
			{
				id: 'val-s',
				value: 'S',
				colorHex: null,
				translations: [
					{ id: 'tv5', lang: 'ar', name: 'صغير' },
					{ id: 'tv6', lang: 'en', name: 'Small' },
				],
			},
			{
				id: 'val-m',
				value: 'M',
				colorHex: null,
				translations: [
					{ id: 'tv7', lang: 'ar', name: 'متوسط' },
					{ id: 'tv8', lang: 'en', name: 'Medium' },
				],
			},
		],
	},
];

export type TProductFormValues = z.infer<typeof formSchemaProduct> & { id?: string };
/** ✅ Unified fields using camelCase naming */
export const fields = ['name', 'description', 'shortDescription', 'slug', 'seoTitle', 'seoDescription', 'seoKeywords'];

export const formSchemaProduct = z
	.object({
		name_ar: z
			.string()
			.trim()
			.min(2, { message: msg('forms.validation.name_ar_min', { min: 2 }) })
			.max(255, { message: msg('forms.validation.name_ar_max', { max: 255 }) }),

		name_en: z
			.string()
			.trim()
			.min(2, { message: msg('forms.validation.name_en_min', { min: 2 }) })
			.max(255, { message: msg('forms.validation.name_en_max', { max: 255 }) }),

		description_ar: z.string().optional(),
		description_en: z.string().optional(),

		shortDescription_ar: z
			.string()
			.trim()
			.max(500, { message: msg('forms.validation.short_description_max', { max: 500 }) })
			.optional(),
		shortDescription_en: z
			.string()
			.trim()
			.max(500, { message: msg('forms.validation.short_description_max', { max: 500 }) })
			.optional(),

		isActive: z.boolean(),
		isFeatured: z.boolean(),

		images: imagesField.min(1, { message: msg('forms.validation.image_required') }),

		brand: z.string().nullable().optional(),
		category: z.string().nullable().optional(),
		collections: z.array(z.string()).optional(),
		tags: z.array(z.string()).optional(),

		basePrice: preprocessNumber(z.number().nonnegative({ message: msg('forms.validation.price_nonnegative') })),

		// discountPrice: preprocessNumber(
		// 	z.number().nonnegative({ message: msg('forms.validation.price_nonnegative') })
		// ).optional(),

		compareAtPrice: preprocessNumber(
			z.number().nonnegative({ message: msg('forms.validation.price_nonnegative') })
		).optional(),

		cost: preprocessNumber(z.number().nonnegative({ message: msg('forms.validation.nonnegative') })).optional(),

		sku: z
			.string()
			.trim()
			.min(1, { message: msg('forms.validation.sku_required') }),

		stockQuantity: preprocessNumber(z.int({ message: msg('forms.validation.integer') })).optional(),

		lowStockAlert: intNotNegativeField.optional(),

		trackInventory: z.boolean(),
		keepSelling: z.boolean(),

		unit: z.string().trim().optional(),

		sortOrder: intNotNegativeField.optional(),

		// ✅ Variants & Combinations
		variants: z.array(variantFormSchema).optional(),
		combinations: z.array(combinationSchema).optional(),
		specifications: z.array(specificationSectionSchema),

		type: z.string().optional(),

		weight: preprocessNumber(z.number().nonnegative()).optional(),
		length: preprocessNumber(z.number().nonnegative()).optional(),
		width: preprocessNumber(z.number().nonnegative()).optional(),
		height: preprocessNumber(z.number().nonnegative()).optional(),
	})
	.extend(SEOFormSchema.shape);
// .refine((data) => !data.compareAtPrice || data.compareAtPrice >= data.basePrice, {
// 	message: msg('forms.validation.discount_less_than_base_price'),
// 	path: ['compareAtPrice'],
// });

export const defaultValuesProduct: TProductFormValues = {
	name_ar: '',
	name_en: '',
	shortDescription_ar: '',
	shortDescription_en: '',
	description_ar: '',
	description_en: '',

	isActive: true,
	isFeatured: false,

	images: [],

	basePrice: 0,
	// discountPrice: undefined,
	compareAtPrice: undefined,
	cost: undefined,
	// discountEndDate: '',

	sku: '',

	stockQuantity: 0,
	lowStockAlert: 5,
	trackInventory: true,

	unit: '',
	keepSelling: false,

	sortOrder: 0,

	brand: null,
	category: null,
	collections: [],
	tags: [],

	variants: [],
	combinations: [],
	specifications: [],

	type: '',

	weight: 0,
	length: 0,
	width: 0,
	height: 0,

	...SEODefaultValues,
};

// ✅ check: product_cost <= basePrice
// .refine((data) => data.product_cost <= data.basePrice, {
// 	message: msg('forms.validation.cost_less_than_base'),
// 	path: ['product_cost'],
// })

// ✅ update copy of the schema - all fields are optional
// export const updateProductSchema = formSchemaProduct.partial();

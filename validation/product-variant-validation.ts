import { msg } from '@/lib/utils';
import z from 'zod';
import { imagesField, preprocessNumber } from './fields-validation';

// ✅ Variant option schema
const variantOptionSchema = z.object({
	id: z.string(),
	value_ar: z.string().min(1),
	value_en: z.string().min(1),
	attributeValueId: z.string().optional(),
	colorHex: z.string().optional(),
});

// ✅ Variant schema
export const variantFormSchema = z.object({
	id: z.string(),
	attributeId: z.string().optional(),
	title_ar: z.string().min(1),
	title_en: z.string().min(1),
	options: z.array(variantOptionSchema).min(1),
	isEditing: z.boolean().optional(),
});

// ✅ Combination schema
export const combinationSchema = z.object({
	id: z.string(),
	variantId: z.string().optional(),
	sku: z.string().optional(),
	attributes: z.array(
		z.object({
			attributeId: z.string(),
			attributeValueId: z.string(),
			name_ar: z.string(),
			name_en: z.string(),
			value_ar: z.string(),
			value_en: z.string(),
			colorHex: z.string().optional(),
		})
	),
	price: z.union([z.string(), z.number()]),
	compareAtPrice: z.union([z.string(), z.number()]).optional(),
	cost: z.union([z.string(), z.number()]).optional(),
	qty: preprocessNumber(z.int({ message: msg('forms.validation.integer') })).optional(),
	images: imagesField.optional(),
	imageId: z.string().optional(),
	checked: z.boolean(),
	// isActive: z.boolean(),
});

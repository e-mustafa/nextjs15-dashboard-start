import z from 'zod';

// ============================================
// SMART VALIDATION SCHEMAS
// ============================================

export const specificationPropertySchema = z
	.object({
		id: z.string(),
		key_ar: z.string(),
		key_en: z.string(),
		value_ar: z.string(),
		value_en: z.string(),
	})
	.superRefine((data, ctx) => {
		// Check if all fields are empty
		const allEmpty = !data.key_ar.trim() && !data.key_en.trim() && !data.value_ar.trim() && !data.value_en.trim();

		// If all empty, it's valid (will be filtered out later)
		if (allEmpty) {
			return;
		}

		// At least one key must be provided
		const hasAnyKey = data.key_ar.trim() || data.key_en.trim();
		if (!hasAnyKey) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'forms.validation.at_least_one_spec_key',
				path: ['key_ar'],
			});
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'forms.validation.at_least_one_spec_key',
				path: ['key_en'],
			});
		}

		// At least one value must be provided
		const hasAnyValue = data.value_ar.trim() || data.value_en.trim();
		if (!hasAnyValue) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'forms.validation.at_least_one_spec_value',
				path: ['value_ar'],
			});
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'forms.validation.at_least_one_spec_value',
				path: ['value_en'],
			});
		}
	});

/**
 * Section schema - ensures at least one title and one valid property
 */
export const specificationSectionSchema = z
	.object({
		id: z.string().optional(),
		title_ar: z.string(),
		title_en: z.string(),
		properties: z.array(specificationPropertySchema),
		isEditing: z.boolean().optional(),
	})
	.superRefine((data, ctx) => {
		// At least one title must be provided
		const hasAnyTitle = data.title_ar.trim() || data.title_en.trim();
		if (!hasAnyTitle) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'forms.validation.at_least_one_section_title',
				path: ['title_ar'],
			});
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'forms.validation.at_least_one_section_title',
				path: ['title_en'],
			});
		}

		// Check if there's at least one non-empty property
		const validProperties = data.properties.filter((prop) => {
			const hasKey = prop.key_ar.trim() || prop.key_en.trim();
			const hasValue = prop.value_ar.trim() || prop.value_en.trim();
			return hasKey && hasValue;
		});

		if (validProperties.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'forms.validation.at_least_one_property',
				path: ['properties'],
			});
		}
	});

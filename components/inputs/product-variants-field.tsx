'use client';

import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { JSX } from 'react';
import { FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ProductVariantsComponent from '../Dashboard/product-variants';
import { FormDescription, FormField, FormItem, FormLabel, FormMessageTranslated } from '../ui-custom/custom-form';

/**
 * Product Variants Field
 *
 * @param {Object} fieldConfig - contains the field name, attributesName, skuName, label, description, required flag, and attributes name
 * @param {Object} form - contains the form control and values
 * @returns {JSX.Element} - renders the product variants field component
 */
export default function ProductVariantsField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { name, label = 'forms.labels.product_variants', description, required = false } = fieldConfig;
	const { t } = useTranslation();

	// ---------- render ----------
	return (
		<div className='grid gap-3'>
			<FormField
				control={form.control}
				name={name}
				render={({ field }) => {
					return (
						<FormItem className={fieldConfig.class}>
							<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>

							<ProductVariantsComponent
								backendVariants={field.value || []}
								availableAttributes={form.getValues(fieldConfig.attributesName as Path<T>) || []}
								productSKU={form.getValues(fieldConfig.skuName as Path<T>)}
							/>

							{description && <FormDescription>{t(description as string)}</FormDescription>}
							<FormMessageTranslated />
						</FormItem>
					);
				}}
			/>
		</div>
	);
}

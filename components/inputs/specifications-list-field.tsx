'use client';

import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { JSX } from 'react';
import { FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
// import SpecificationsList from '../Dashboard/product-specifications';
import SpecificationsList from '../Dashboard/product-specifications-input';
import { FormDescription, FormField, FormItem, FormLabel, FormMessageTranslated } from '../ui-custom/custom-form';

/**
 * Product Specifications Field
 *
 * @param {Object} fieldConfig - contains the field name, defaultValue, label, description, and required flag.
 * @param {Object} form - contains the form control and values
 * @returns {JSX.Element} - renders the product variants field component
 */
export default function SpecificationsListField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { name, label = 'forms.labels.product_specifications', description, required = false } = fieldConfig;
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

							<SpecificationsList fieldName={name as Path<T>} defaultValue={field.value || []} />

							{description && <FormDescription>{t(description as string)}</FormDescription>}
							<FormMessageTranslated />
						</FormItem>
					);
				}}
			/>
		</div>
	);
}

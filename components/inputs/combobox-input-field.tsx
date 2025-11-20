'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui-custom/custom-form';
import { isDEV } from '@/configs/general';
import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { renderErrorMessage } from '@/lib/utils';
import { JSX } from 'react';
import { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormMessageTranslated } from '../ui-custom/custom-form';
import ReusableCombobox from '../ui-custom/reuseable-combobox';
import InfoIconTooltip from './info-icon-tooltip';

/**
 * Combobox input field
 *
 * @param {RenderFieldProps<T, K>} props
 * `optionUrl`: string - API endpoint to fetch options.
 * 
 * `fetchOptions`?: (query: string, page?: number) => Promise<{ data: ComboboxOption[]; pagination: any }>.
 * 
 * `revalidateTags`?: string[] - Tags for revalidation.
 * 
 * `returnObject`?: boolean - Whether to return the full object or just the ID/IDs.
 * 
 * `isProducts`?: boolean - Whether the combobox has additional section to display selected products.
 * 
 * `isTags`?: boolean - Whether the combobox is for tags.
 * 
 * `deleteTag`?: (id: string) => Promise<void> - Function to delete a tag by ID.
 * 
 * `multiple`?: boolean - Whether multiple selections are allowed.
 * 
 * @returns {JSX.Element}
 *
 */
export function ComboboxInputField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const {
		name,
		label,
		placeholder,
		required,
		description,
		optionUrl,
		revalidateTags,
		fetchOptions,
		isTags,
		multiple = isTags,
		returnObject = false,
	} = fieldConfig;
	const {
		t,
		i18n: { language },
	} = useTranslation();

	async function fetchItemsFromAPI(query: string, page: number = 1) {
		const params = new URLSearchParams({
			search: query || '',
			page: page.toString(),
			limit: '10',
		});

		// try {
		const response = await fetch(`${optionUrl}?${params}`, {
			headers: { 'Accept-Language': language },
			next: { tags: revalidateTags },
		});

		if (!response.ok) {
			isDEV && console.error(t('api.errors.Failed_fetch_list'));
			throw new Error(t('api.errors.Failed_fetch_list'));
		}

		const result = await response.json();

		// Map the API response to the ComboboxOption format
		return {
			data: result.data.map((item: any) => ({
				id: item.id,
				name: item.name,
				image: item.logo, // adjust if your API uses a different field for image
				...item,
			})),
			pagination: result.pagination,
		};
		// } catch (error) {
		// 	isDEV && console.error('Error fetching data:', error);
		// 	throw new Error('Failed to fetch list of data');
		// }
	}

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => {
				const value = field.value;
				console.log('field.value', field.value);
				return (
					<FormItem className={fieldConfig.class}>
						{!fieldConfig.infoContent ? (
							<FormLabel aria-required={!!required}>{renderErrorMessage(label as string, t)}</FormLabel>
						) : (
							// info icon
							<div className='relative flex items-center justify-between h-3.5'>
								<FormLabel aria-required={!!required}>{renderErrorMessage(label as string, t)}</FormLabel>

								<InfoIconTooltip
									info={t(fieldConfig.infoContent as string) || ''}
									t={t}
									Icon={fieldConfig.InfoIcon && fieldConfig.InfoIcon}
								/>
							</div>
						)}
						<FormControl>
							<ReusableCombobox
								fetchOptions={fetchOptions ? fetchOptions : fetchItemsFromAPI}
								multiple={multiple}
								placeholder={placeholder}
								searchPlaceholder={fieldConfig.searchPlaceholder}
								emptyMessage={fieldConfig.emptyMessage}
								className='w-full'
								debounceMs={400}
								pageSize={10}
								enableInfiniteScroll={true}
								isProducts={fieldConfig.isProducts}
								isTags={fieldConfig.isTags}
								deleteTag={fieldConfig.deleteTag}
								returnFullObject={returnObject}
								// onChange={(val) => setBrandsValue(val as string[])}
								// onChange={field.onChange}
								{...field}
								// options={Array.isArray(value) ? value : [value]}
								// value={value && Array.isArray(value) ? value?.map((v: T) => v.id) : value?.id}
							/>
						</FormControl>
						{description && <FormDescription>{t(description)}</FormDescription>}
						<FormMessageTranslated />
					</FormItem>
				);
			}}
		/>
	);
}

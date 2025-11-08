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

export function ComboboxInputField<T extends FieldValues, K extends keyof FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { name, label, placeholder, required, description, optionUrl, revalidateTags, fetchOptions } = fieldConfig;
	const { t, i18n } = useTranslation();

	// const [brandsValue, setBrandsValue] = useState<string[]>(form.getValues(name) as string[]);

	// async function fetchItemsFromAPI<T>(query: string, page: number = 1): Promise<PaginatedResponse<T>> {
	// async function fetchItemsFromAPI(
	// 	query: string,
	// 	page: number = 1
	// ): Promise<PaginatedResponse<ComboboxOptionWithIdAndName<any>> | ComboboxOptionWithIdAndName<any>[]> {

	// Define the ComboboxOption type to match what ReusableCombobox expects
	type ComboboxOption = {
		id: string | number;
		name: string;
		image?: string;
		[key: string]: any;
	};

	async function fetchItemsFromAPI(query: string, page: number = 1) {
		const params = new URLSearchParams({
			search: query || '',
			page: page.toString(),
			limit: '10',
		});

		// try {
		const response = await fetch(`${optionUrl}?${params}`, {
			headers: {
				'Accept-Language': i18n.language, // or get from context
			},
			next: { tags: revalidateTags },
		});
		console.log('response', response);
		if (!response.ok) {
			isDEV && console.error('Failed to fetch list of data');
			throw new Error('Failed to fetch list of data');
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

				console.log('value', value);

				return (
					<FormItem>
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
								multiple={fieldConfig.multiple}
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
								// value={value}
								// onChange={(val) => setBrandsValue(val as string[])}
								// onChange={field.onChange}
								{...field}
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

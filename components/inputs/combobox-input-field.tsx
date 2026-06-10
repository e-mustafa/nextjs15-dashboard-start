'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui-custom/custom-form';
import { isDEV } from '@/configs/general';
import useLocale from '@/hooks/useLocale';
import { RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { renderErrorMessage } from '@/lib/utils';
import { JSX, ReactNode } from 'react';
import { FieldValues } from 'react-hook-form';
import InfoIconTooltip from '../Shared/info-icon-tooltip';
import { FormMessageTranslated } from '../ui-custom/custom-form';
import ReusableCombobox, { ComboboxOption } from '../ui-custom/reuseable-combobox';

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
 * `linkHref`?: string - Link href for each option.
 *
 * `multiple`?: boolean - Whether multiple selections are allowed.
 *
 * @returns {JSX.Element}
 *
 */
export default function ComboboxInputField<T extends FieldValues>({
	fieldConfig,
	form,
}: RenderFieldProps<T, 'combobox'>): JSX.Element {
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
		returnObject = false, // Default: return IDs only
		linkHref,
		initialItems, // ← From backend response
	} = fieldConfig;

	const { t, locale } = useLocale();

	async function fetchItemsFromAPI(query: string, page: number = 1) {
		const params = new URLSearchParams({
			search: query || '',
			page: page.toString(),
			limit: '10',
		});

		const response = await fetch(`${optionUrl}?${params}`, {
			headers: { 'Accept-Language': locale },
			next: { tags: revalidateTags },
		});

		if (!response.ok) {
			isDEV && console.error(t('api.errors.Failed_fetch_list'));
			throw new Error(t('api.errors.Failed_fetch_list'));
		}

		const result = await response.json();

		return {
			data: result.data.map((item: any) => ({
				id: item.id,
				name: item.name,
				image: item.image || item.logo,
				basePrice: item.basePrice, // For products
				...item,
			})),
			pagination: result.pagination,
		};
	}

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem className={fieldConfig.class}>
						{!fieldConfig.infoContent ? (
							<FormLabel aria-required={!!required}>{renderErrorMessage(label as string, t)}</FormLabel>
						) : (
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
								returnFullObject={returnObject} // ← Default: false (return IDs)
								linkHref={linkHref}
								customColumn={fieldConfig.customColumn as ((option: ComboboxOption) => ReactNode) | undefined}
								initialItems={initialItems} // ← Pass initial items from backend
								{...field}
								// ✅ field.value can be:
								// - Create mode: [] (empty)
								// - Edit mode: ['id1', 'id2'] (IDs)
								// - Edit mode with initialItems: full objects will be shown
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

import { JSX, useId } from 'react';
import { FieldValues, Path } from 'react-hook-form';

import InfoIconTooltip from '@/components/inputs/info-icon-tooltip';
import { FormControl, FormField, FormItem, FormLabel, FormMessageTranslated } from '@/components/ui-custom/custom-form';
import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../ui-custom/custom-checkbox';

/**
 * Checkbox input field
 *
 * @param {Object} fieldConfig - The configuration of the field
 * @param {Object} form - The form object of react-hook-form
 *
 * @returns {JSX.Element} The rendered component
 */
export default function CheckboxInputField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig: { name, label, placeholder, infoContent, required, IconStart, locale, items, ...fieldConfig },
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();
	const id = useId();

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{!infoContent ? (
						<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
					) : (
						// info icon
						<div className='relative flex items-center justify-between h-3.5'>
							<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>

							<InfoIconTooltip
								info={t(infoContent as string) || ''}
								t={t}
								Icon={fieldConfig.InfoIcon && fieldConfig.InfoIcon}
							/>
						</div>
					)}

					{/* <FormControl></FormControl> */}
					<div className='flex gap-2 items- py-1.5'>
						<Checkbox id={id} checked={field.value} onCheckedChange={field.onChange} {...field} />

						<FormLabel htmlFor={id} className='text-sm font-normal'>
							{t(placeholder as string)}
						</FormLabel>
					</div>

					{!!items &&
						items?.map((item: { name: string; label: string; checked: boolean }) => (
							<FormField
								key={item.name}
								control={form.control}
								name={item.name as Path<T>}
								render={({ field }) => {
									return (
										<FormItem key={item.name} className='flex flex-row items-center'>
											<FormControl>
												<Checkbox checked={field.value} onCheckedChange={(checked) => !checked} />
											</FormControl>
											<FormLabel className='text-sm font-normal'>{t(item?.label as string)}</FormLabel>
										</FormItem>
									);
								}}
							/>
						))}
					{/* <FormMessage /> */}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

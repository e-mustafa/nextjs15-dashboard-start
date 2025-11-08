import { JSX } from 'react';
import { FieldValues, Path } from 'react-hook-form';

import InfoIconTooltip from '@/components/inputs/info-icon-tooltip';
import { FormControl, FormField, FormItem, FormLabel, FormMessageTranslated } from '@/components/ui-custom/custom-form';
import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../ui/checkbox';

/**
 * Switch input field
 */
export default function CheckboxInputField<T extends FieldValues, K extends keyof FieldTypeMap>({
	fieldConfig: { name, label, placeholder, infoContent, required, IconStart, locale, items, ...fieldConfig },
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();

	return (
		<FormField
			control={form.control}
			name={name}
			render={() => (
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
					{items?.map((item: { name: string; label: string; checked: boolean }) => (
						<FormField
							key={item.name}
							control={form.control}
							name={item.name as Path<T>}
							render={({ field }) => {
								return (
									<FormItem key={item.name} className='flex flex-row items-start space-x-3 space-y-0'>
										<FormControl>
											<Checkbox
												checked={field.value?.includes(item.name)}
												onCheckedChange={(checked) => {
													return checked
														? field.onChange([...field.value, item.name])
														: field.onChange(field.value?.filter((value: string) => value !== item.name));
												}}
											/>
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

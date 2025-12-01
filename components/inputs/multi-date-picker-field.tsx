'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui-custom/custom-form';
import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { cn } from '@/lib/utils';
import { Calendar1Icon, CalendarDaysIcon, CalendarRangeIcon } from 'lucide-react';
import { JSX } from 'react';
import { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormMessageTranslated } from '../ui-custom/custom-form';
import InfoIconTooltip from './info-icon-tooltip';
import MultiDatePicker, { EnumDatePickerMode } from './multi-date-picker';

export function MultiDatePickerField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const {
		name,
		label,
		required,
		description,
		datePickerMode,
		dateOptions = {},
		IconStart = datePickerMode === EnumDatePickerMode.MULTIPLE
			? CalendarDaysIcon
			: datePickerMode === EnumDatePickerMode.RANGE
			? CalendarRangeIcon
			: Calendar1Icon,
	} = fieldConfig;

	const { t } = useTranslation();

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className={fieldConfig.class}>
					{!fieldConfig.infoContent ? (
						label && <FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
					) : (
						// info icon
						<div className='relative flex items-center justify-between h-3.5'>
							<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>

							<InfoIconTooltip
								info={t(fieldConfig.infoContent as string) || ''}
								t={t}
								Icon={fieldConfig.InfoIcon && fieldConfig.InfoIcon}
							/>
						</div>
					)}
					<FormControl>
						<div className='relative'>
							<MultiDatePicker
								{...fieldConfig}
								// {...field}
								dateOptions={dateOptions}
								value={field.value}
								onChange={field.onChange}
								mode={fieldConfig.datePickerMode}
								inputClass={cn(IconStart && 'ps-10', fieldConfig.IconEnd && 'pe-10', fieldConfig.inputClass)}
							/>

							{IconStart && (
								<div className='absolute top-1/2 -translate-y-1/2 start-2 me-2 w-5 text-muted-foreground'>
									<IconStart />
								</div>
							)}

							{fieldConfig.IconEnd && (
								<div className='absolute top-1/2 -translate-y-1/2 end-2 ms-2 w-5 text-muted-foreground'>
									<fieldConfig.IconEnd />
								</div>
							)}
						</div>
					</FormControl>
					{description && <FormDescription>{t(description)}</FormDescription>}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

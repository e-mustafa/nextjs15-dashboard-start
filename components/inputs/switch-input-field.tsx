import { JSX, useId } from 'react';
import { FieldValues } from 'react-hook-form';

import InfoIconTooltip from '@/components/inputs/info-icon-tooltip';
import { FormDescription, FormField, FormItem, FormLabel, FormMessageTranslated } from '@/components/ui-custom/custom-form';
import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Switch } from '../ui/switch';

/**
 * Switch input field
 *
 * @param {RenderFieldProps<T, K>} props variants can be 'input' to be same as input text or undefined
 * @returns {JSX.Element}
 */
export default function SwitchInputField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig: { name, label, placeholder, infoContent, required, IconStart, locale, variants, ...fieldConfig },
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();
	const id = useId();

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className={fieldConfig.class}>
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

					<div
						data-slot='input'
						className={cn(
							'flex gap-3 items-center',
							variants === 'input' &&
								'justify-between file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input  h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&_label]:grow'
						)}
					>
						<FormLabel htmlFor={id} className='text-sm font-normal text-muted-foreground '>
							{t(placeholder as string)}
						</FormLabel>
						<Switch
							id={id}
							dir='ltr'
							checked={field.value}
							onCheckedChange={field.onChange}
							{...field}
							className='scale-125 m-1'
						/>
					</div>

					{fieldConfig.description && <FormDescription>{t(fieldConfig.description)}</FormDescription>}
					{/* <FormMessage /> */}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

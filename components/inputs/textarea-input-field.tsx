import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { JSX } from 'react';
import { FieldValues, Path } from 'react-hook-form';

import InfoIconTooltip from '@/components/inputs/info-icon-tooltip';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessageTranslated,
} from '@/components/ui-custom/custom-form';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Textarea } from '../ui/textarea';

/**
 * Textarea input field
 */
export default function TextareaInputField<T extends FieldValues, K extends keyof FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();

	// useEffect(() => {
	// 	if (!fieldConfig.referenceInput) return;
	// 	const referenceData = form.watch(fieldConfig.referenceInput as Path<T>)?.trim();

	// 	if (!referenceData) return;

	// 	form.setValue(fieldConfig.name as Path<T>, referenceData, { shouldValidate: true });
	// }, [form.watch(fieldConfig.referenceInput as Path<T>)]);

	return (
		<FormField
			control={form.control}
			name={fieldConfig.name as Path<T>}
			render={({ field }) => (
				<FormItem>
					{!fieldConfig.infoContent ? (
						<FormLabel aria-required={!!fieldConfig.required}>{t(fieldConfig.label as string)}</FormLabel>
					) : (
						// info Icon
						<div className='relative flex items-center justify-between h-3.5'>
							<FormLabel aria-required={!!fieldConfig.required}>{t(fieldConfig.label as string)}</FormLabel>

							<InfoIconTooltip
								info={t(fieldConfig.infoContent as string) || ''}
								t={t}
								Icon={fieldConfig.InfoIcon && fieldConfig.InfoIcon}
							/>
							{/* <div className='absolute top-1/2 -translate-y-1/2 end-0 [&_svg]:size-5 text-muted-foreground'></div> */}
						</div>
					)}

					<FormControl>
						<Textarea
							placeholder={t(fieldConfig.placeholder as string)}
							className={cn(fieldConfig.IconStart && 'ps-10', fieldConfig.IconEnd && 'pe-10')}
							{...field}
							value={field.value || ''}
							rows={fieldConfig.rows}
							// onChange={fieldConfig.onChange ? (event) => fieldConfig.onChange?.(event, form) : field.onChange}
						/>
					</FormControl>

					{fieldConfig.description && <FormDescription>{t(fieldConfig.description)}</FormDescription>}
					{/* <FormMessage /> */}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

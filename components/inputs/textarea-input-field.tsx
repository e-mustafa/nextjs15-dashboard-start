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
 *
 * @param {RenderFieldProps<T, K>} props
 * rows: number of rows for the textarea
 * @returns {JSX.Element}
 */

export default function TextareaInputField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();

	return (
		<FormField
			control={form.control}
			name={fieldConfig.name as Path<T>}
			render={({ field }) => (
				<FormItem className={fieldConfig.class}>
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
						</div>
					)}

					<FormControl>
						<Textarea
							placeholder={t(fieldConfig.placeholder as string)}
							className={cn(fieldConfig.IconStart && 'ps-10', fieldConfig.IconEnd && 'pe-10')}
							{...field}
							value={field.value || ''}
							rows={fieldConfig.rows}
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

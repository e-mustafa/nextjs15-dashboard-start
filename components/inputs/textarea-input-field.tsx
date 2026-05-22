import { RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { JSX } from 'react';
import { FieldValues } from 'react-hook-form';

import InfoIconTooltip from '@/components/Shared/info-icon-tooltip';
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

export default function TextareaInputField<T extends FieldValues>({
	fieldConfig: { name, label, required, infoContent, IconStart, IconEnd, description, ...fieldConfig },
	form,
}: RenderFieldProps<T, 'textarea'>): JSX.Element {
	const { t } = useTranslation();

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className={fieldConfig.class}>
					{!infoContent ? (
						<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
					) : (
						// info Icon
						<div className='relative flex items-center justify-between h-3.5'>
							<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>

							<InfoIconTooltip
								info={t(infoContent as string) || ''}
								t={t}
								Icon={fieldConfig.InfoIcon && fieldConfig.InfoIcon}
							/>
						</div>
					)}

					<FormControl>
						<Textarea
							placeholder={t(fieldConfig.placeholder as string)}
							className={cn(IconStart && 'ps-10', IconEnd && 'pe-10')}
							{...field}
							value={field.value || ''}
							rows={fieldConfig?.rows}
						/>
					</FormControl>

					{description && <FormDescription>{t(description)}</FormDescription>}
					{/* <FormMessage /> */}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

import { JSX, useEffect } from 'react';
import { FieldValues, Path } from 'react-hook-form';
import { FieldTypeMap, RenderFieldProps } from './types-create-forms';

import InfoIconTooltip from '@/components/inputs/info-icon-tooltip';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessageTranslated,
} from '@/components/ui-custom/custom-form';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils';

/**
 * Base input field (text, email, number, etc.)
 */
export default function BaseInputField<T extends FieldValues, K extends keyof FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();

	useEffect(() => {
		if (!fieldConfig.referenceInput) return;
		const referenceData = form.watch(fieldConfig.referenceInput as Path<T>)?.trim();

		if (!referenceData) return;
		form.setValue(fieldConfig.name as Path<T>, referenceData, { shouldValidate: true });
		
	}, [form.watch(fieldConfig.referenceInput as Path<T>)]);

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

					<div className='relative'>
						<FormControl>
							<Input
								type={fieldConfig.type}
								placeholder={t(fieldConfig.placeholder as string)}
								className={cn(fieldConfig.IconStart && 'ps-10', fieldConfig.IconEnd && 'pe-10')}
								{...field}
								value={field.value || ''}
								onChange={fieldConfig.onChange ? (event) => fieldConfig.onChange?.(event, form) : field.onChange}
							/>
						</FormControl>

						{fieldConfig.IconStart && (
							<div className='absolute top-1/2 -translate-y-1/2 start-2 me-2 w-5 text-muted-foreground'>
								<fieldConfig.IconStart />
							</div>
						)}

						{fieldConfig.IconEnd && (
							<div className='absolute top-1/2 -translate-y-1/2 end-2 ms-2 w-5 text-muted-foreground'>
								<fieldConfig.IconEnd />
							</div>
						)}
					</div>
					{fieldConfig.description && <FormDescription>{t(fieldConfig.description)}</FormDescription>}
					{/* <FormMessage /> */}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

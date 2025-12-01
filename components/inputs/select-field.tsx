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
import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { useTranslation } from 'react-i18next';
import ReusableSelect from './reusable-select';

export default function SelectField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig: { name, label, required, options, noneItem, sectorProperty_1, sectorProperty_2, ...fieldConfig },
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();

	return (
		<FormField
			control={form.control}
			name={name as Path<T>}
			render={({ field }) => (
				<FormItem className={fieldConfig.class}>
					{!fieldConfig.infoContent ? (
						<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
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

					<div className='relative'>
						<FormControl>
							<ReusableSelect
								items={options || []}
								placeholder={fieldConfig.placeholder}
								{...field}
								noneItem={noneItem}
								sectorProperty_1={sectorProperty_1}
								sectorProperty_2={sectorProperty_2}
								className={fieldConfig.class}
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

import { JSX, useEffect } from 'react';
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';

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
import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { slugify } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import { TicketSlashIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Slug input field
 */
export default function SlugInputField<T extends FieldValues, K extends keyof FieldTypeMap>({
	fieldConfig: {
		name,
		label = 'forms.labels.slug',
		placeholder = 'forms.placeholders.slug',
		infoContent = 'forms.infos.slug',
		required = true,
		IconStart = TicketSlashIcon,
		locale,
		referenceInput,
		...fieldConfig
	},
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();

	const formatSlug = (slug: string, form: UseFormReturn<T>) => {
		// if (slug) return;

		const formattedSlug = slugify(slug, locale);

		form.setValue(name as Path<T>, formattedSlug as PathValue<T, Path<T>>, { shouldValidate: true });
	};

	useEffect(() => {
		const referenceData = form.watch(referenceInput as Path<T>)?.trim();

		if (!referenceData) return;

		formatSlug(referenceData, form);
	}, [form.watch(referenceInput as Path<T>)]);

	return (
		<FormField
			control={form.control}
			name={name as Path<T>}
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

					<div className='relative'>
						<FormControl>
							<Input
								type='text'
								placeholder={t(placeholder as string)}
								className={cn(IconStart && 'ps-10', fieldConfig.IconEnd && 'pe-10')}
								{...field}
								onChange={(event) => formatSlug(event.target.value, form)}
							/>
						</FormControl>

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
					{fieldConfig.description && <FormDescription>{t(fieldConfig.description)}</FormDescription>}
					{/* <FormMessage /> */}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

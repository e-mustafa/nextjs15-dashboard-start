'use client';

import { RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { cn } from '@/lib/utils';
import { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { RichTextInput } from '../Dashboard/rich-text-editor/rich-text-input';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessageTranslated,
} from '../ui-custom/custom-form';

export default function RichTextField<T extends FieldValues>({ fieldConfig, form }: RenderFieldProps<T, 'richtext'>) {
	const { name, label, class: className, placeholder, description, required } = fieldConfig;
	const { t } = useTranslation();

	return (
		<div className={cn('grid gap-2', className)}>
			<FormField
				control={form.control}
				name={name}
				render={({ field }) => (
					<FormItem>
						<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
						<FormControl>
							<RichTextInput placeholder={t(placeholder as string)} {...field} />
						</FormControl>

						{description && <FormDescription>{t(description)}</FormDescription>}

						<FormMessageTranslated />
					</FormItem>
				)}
			/>
		</div>
	);
}

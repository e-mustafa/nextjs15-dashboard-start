'use client';

import { RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormDescription, FormField, FormItem, FormLabel, FormMessageTranslated } from '../ui-custom/custom-form';
import ImageUploadInput from './image-upload-input';

/*
	WHY: this component displays the selected images, opens ImageManagerDialog to select them,
	and supports reordering via drag-and-drop when multiple === true
*/
export default function ImageUploadField<T extends FieldValues>({ fieldConfig, form }: RenderFieldProps<T, 'imageUpload'>) {
	const { name, label = 'forms.labels.image', description, required = false, multiple = false, folder } = fieldConfig;
	const { t } = useTranslation();

	return (
		<div className='grid gap-3'>
			<FormField
				control={form.control}
				name={name}
				render={({ field }) => (
					<FormItem className={fieldConfig.class}>
						<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>

						<ImageUploadInput field={field} />

						{description && <FormDescription>{t(description as string)}</FormDescription>}
						<FormMessageTranslated />
					</FormItem>
				)}
			/>
		</div>
	);
}

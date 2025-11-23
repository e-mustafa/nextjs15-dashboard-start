'use client';

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormDescription, FormField, FormItem, FormLabel, FormMessageTranslated } from '../ui-custom/custom-form';
import ImageUploadInput from './image-upload-input';

type ImageFieldProps<T extends FieldValues> = {
	fieldConfig: {
		name: Path<T>;
		label?: string;
		placeholder?: string;
		required?: boolean;
		multiple?: boolean;
		folder?: string;
		description?: string | undefined;
		accept?: string;
		maxSize?: number;
		class?: string;
	};
	form: UseFormReturn<T>;
};

/*
	WHY: this component displays the selected images, opens ImageManagerDialog to select them,
	and supports reordering via drag-and-drop when multiple === true
*/
export default function ImageUploadField<T extends FieldValues>({ fieldConfig, form }: ImageFieldProps<T>) {
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

'use client';

import ImageManager, { ImageKitFile } from '@/components/media/image-manager';
import { Label } from '@/components/ui/label';
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type ImageFieldProps<T extends FieldValues> = {
	fieldConfig: {
		name: Path<T>;
		label?: string;
		placeholder?: string;
		required?: boolean;
		multiple?: boolean;
		folder?: string;
	};
	form: UseFormReturn<T>;
};

export default function ImageManagerField<T extends FieldValues>({
	fieldConfig: { name, label = 'forms.labels.image', multiple = false, folder },
	form,
}: ImageFieldProps<T>) {
	const { t } = useTranslation();

	// Watch current field value (string | string[])
	const value = form.watch(name);

	// Transform form value into ImageManager's "value" format
	const valueAsFiles: ImageKitFile[] = Array.isArray(value)
		? value.map((url: string) => ({ fileId: '', name: url, url }))
		: value
		? [{ fileId: '', name: value, url: value }]
		: [];

	return (
		<div className='grid gap-2'>
			<Label aria-required={true}>{t(label)}</Label>
			<ImageManager
				multiple={multiple}
				folder={folder}
				value={valueAsFiles}
				onChange={(files) => {
					if (multiple) {
						form.setValue(name, files.map((f) => f.url) as PathValue<T, typeof name>);
					} else {
						form.setValue(name, (files[0]?.url ?? '') as PathValue<T, typeof name>);
					}
				}}
			/>
		</div>
	);
}

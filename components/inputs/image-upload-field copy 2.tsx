'use client';

import { ImageKitFile } from '@/components/media/image-manager';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import UploadInput from '../media/upload-image-input';

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

export default function ImageUploadField<T extends FieldValues>({
	fieldConfig: { name, label = 'forms.labels.image', multiple = false },
	form,
}: ImageFieldProps<T>) {
	const { t } = useTranslation();

	const defaultValue = form.getValues(name);
	const [value, setValue] = useState(Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []);
	console.log('ImageUploadField value:', value);
	// Watch current field value (string | string[])
	// const value = form.watch(name);

	// Transform form value into ImageManager's "value" format
	const valueAsFiles: ImageKitFile[] = Array.isArray(value)
		? value.map((url: string) => ({ fileId: '', name: url, url }))
		: value
		? [{ fileId: '', name: value, url: value }]
		: [];

	return (
		<div className='grid gap-2'>
			<Label aria-required={true}>{t(label)}</Label>
			{/* <ImageManager
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
			/> */}

			<UploadInput
				multiple={multiple}
				// accept='image/*'
				value={value.map((file) => ({ url: file })) as unknown as ImageKitFile[]}
				// onChange={setValue as (files: ImageKitFile[]) => void}
				onChange={(files: ImageKitFile[]) => {
					const data = files.map((f) => ({ fileId: f.fileId, url: f.url })) as PathValue<T, typeof name>;

					// if (multiple) {
					// 	data = files.map((f) => f.url) as PathValue<T, typeof name>;
					// } else {
					// 	data = files[0]?.url ?? '';
					// }
					form.setValue(name, data as PathValue<T, typeof name>);
					setValue(data as PathValue<T, typeof name>);
					console.log('ImageKitFile value:', data);
				}}
			/>
		</div>
	);
}

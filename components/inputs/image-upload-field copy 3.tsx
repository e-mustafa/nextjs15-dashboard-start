'use client';

import { ImageKitFile } from '@/components/media/image-manager';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ImagePlusIcon, ImageUpIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ImageManagerDialog from '../media/image-manager-dialog';
import { Button } from '../ui-custom/custom-button';
import { Checkbox } from '../ui/checkbox';

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
	fieldConfig: { name, label = 'forms.labels.image', multiple = false, folder },
	form,
}: ImageFieldProps<T>) {
	const { t } = useTranslation();

	const defaultValue = form.getValues(name);
	const [images, setImages] = useState<ImageKitFile[]>(
		Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
	);
	console.log('ImageUploadField images:', images);

	// Watch current field value (string | string[])
	// const value = form.watch(name);

	// Transform form value into ImageManager's "value" format
	// const valueAsFiles: ImageKitFile[] = Array.isArray(images)
	// 	? images.map((file) => ({ fileId: file.fileId, url: fileurl }))
	// 	: images
	// 	? [{ fileId: '', name: images, url: images }]
	// 	: [];
	// const [images, setImages] = useState<string[]>(data);
	const [open, setOpen] = useState(false);

	function handelChange(files: ImageKitFile[]) {
		const data = files.map((f) => ({ fileId: f.fileId, url: f.url })) as PathValue<T, typeof name>;
		form.setValue(name, data as PathValue<T, typeof name>);
		setImages(data as PathValue<T, typeof name>);
		console.log('ImageKitFile value:', data);
	}

	return (
		<div className='grid gap-3'>
			<Label aria-required={true}>{t(label)}</Label>

			<div className='min-h-60 w-full grid gap-3 border-2 border-dashed rounded-xl'>
				{images.length > 0 ? (
					<div className='grid md:grid-cols-3 lg:grid-cols-7 gap-3 p-2 sm:p-4 max-h-96 overflow-y-auto'>
						{images.map((image, index) => (
							<div
								key={image.fileId || image.url}
								className={cn('p-1 relative aspect-square', index == 0 && 'col-span-2 row-span-2')}
							>
								<Image
									src={image.url}
									width={200}
									height={200}
									alt='image'
									className='rounded-lg aspect-square size-full'
								/>

								<div className='absolute top-1 end-1 p-2 flex gap-1'>
									<Checkbox
										checked={!!images.find((item) => item.fileId === image.fileId)}
										onCheckedChange={() => setImages((prev) => prev.filter((f) => f !== image))}
										id={image.fileId || image.url}
										aria-label='Select image'
										className='scale-125 shadow shadow-accent'
									/>
								</div>
							</div>
						))}
						<Button
							type='button'
							onClick={() => setOpen(true)}
							variant='ghost'
							className='w-full h-auto rounded-lg grid place-items-center p-4 bg-accent/10 text-muted-foreground sm:aspect-square'
						>
							<ImagePlusIcon className='size-full text-muted-foreground' />
						</Button>
					</div>
				) : (
					<div className='size-full grid place-items-center gap-4 p-4 col-span-full'>
						<Button
							type='button'
							onClick={() => setOpen(true)}
							variant='ghost'
							className='bg-accent/10 text-muted-foreground h-16'
						>
							<div className='flex items-center gap-2'>
								<ImageUpIcon className='size-12' />
								{t('forms.placeholders.upload_general')}
							</div>
						</Button>

						<p className='text-xs text-muted-foreground text-center self-end'>
							{multiple ? t('forms.infos.upload_image_multiple') : t('forms.infos.upload_image_single')}
						</p>
					</div>
				)}
			</div>

			<ImageManagerDialog
				open={open}
				setOpen={setOpen}
				value={images}
				multiple={multiple}
				folder={folder}
				onChange={handelChange}
			/>
		</div>
	);
}

'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TImage } from '@/types/api';
import { ImageUpIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageKitFile } from '../media/image-manager';
import ImageManagerModal from '../media/image-manager-modal';

type UploadImageProps = {
	multiple?: boolean;
	folder?: string;
	value?: TImage[];
	onChange?: (files: TImage[]) => void;
};

/**
 * UploadImageShaped is a component that allows users to upload one or multiple images with small input design.
 * It uses the ImageKit library to handle image uploads.
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.multiple - Whether to allow multiple images to be uploaded.
 * @param {string} props.folder - The folder where the images should be uploaded.
 * @param {TImage[]} props.value - The initial images to be displayed.
 * @param {(files: TImage[]) => void} props.onChange - The callback function to be called when the images change.
 *
 * @returns {JSX.Element} - The component JSX element.
 */
export default function UploadImageShaped({ multiple = false, folder = 'products', value = [], onChange }: UploadImageProps) {
	const { t } = useTranslation();
	
	const [open, setOpen] = useState(false);
	const [images, setImages] = useState<TImage[]>(value);

	// ✅ Sync with external value changes
	function handleManagerChange(files: ImageKitFile[]) {
		// add images with only fileId and url
		const data = files.map((file) => ({ fileId: file.fileId, url: file.url }));
		setImages(data);
		onChange?.(data);
	}

	function handleRemove(fileId: string) {
		// setImages((prev) => prev.filter((item) => item?.fileId !== fileId));
		// onChange?.(images.filter((item) => item?.fileId !== fileId));

		// const newImages = images.filter((item) => item?.fileId !== fileId);
		setImages([]);
		onChange?.([]);
	}

	return (
		<div className='flex flex-col items-center gap-2 max-w-full max-h-full'>
			<div className={cn('size-full relative flex w-full justify-center')}>
				{/* Drop area */}
				<button
					type='button'
					className='size-full! border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 relative flex items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors outline-none focus-visible:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none'
					onClick={() => setOpen(true)}
					aria-label={!!images?.length ? t('forms.placeholders.change_image') : t('forms.placeholders.upload_image')}
				>
					{!!images?.length ? (
						<Image
							className='object-cover aspect-square'
							src={images[0]?.url as string}
							alt={t('forms.labels.variant_image')}
							width={48}
							height={48}
						/>
					) : (
						<div aria-hidden='true' className='size-full'>
							<ImageUpIcon className='size-full opacity-60' />
						</div>
					)}
				</button>
				{!!images?.length && (
					<Button
						onClick={() => handleRemove}
						size='icon'
						className='border-background focus-visible:border-background absolute -top-1 -right-1 size-6 rounded-full border-2 shadow-none'
						aria-label={t('common.actions.remove_image')}
					>
						<XIcon className='size-3.5' />
					</Button>
				)}
			</div>
			{/* <p className='text-xs text-muted-foreground line-clamp-1 h-4'>{files[0]?.file.name}</p> */}
			<ImageManagerModal
				open={open}
				setOpen={setOpen}
				value={images as ImageKitFile[]}
				multiple={multiple}
				folder={folder}
				onChange={handleManagerChange}
			/>
		</div>
	);
}

import { cn } from '@/lib/utils';
import { ImagePlusIcon, ImageUpIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui-custom/custom-button';
import { Checkbox } from '../ui/checkbox';
import { ImageKitFile, ImageManagerProps } from './image-manager';
import ImageManagerDialog from './image-manager-dialog';

const data: string[] = [
	// 'https://picsum.photos/200/300?random=1',
	// 'https://picsum.photos/200/300?random=2',
	// 'https://picsum.photos/200/300?random=3',
	// 'https://picsum.photos/200/300?random=4',
	// 'https://picsum.photos/200/300?random=5',
];

export default function UploadImageInput(props: ImageManagerProps) {
	const { t } = useTranslation();

	const [images, setImages] = useState<string[]>(data);
	const [open, setOpen] = useState(false);

	function handelChange(files: ImageKitFile[]) {
		// setImages((prev) => [...prev, ...files.map((f) => f.url)]);
		setImages(files.map((f) => f.url));
	}

	return (
		<div className='min-h-60 w-full grid md:grid-cols-3 lg:grid-cols-7 gap-3 border-2 border-dashed rounded-xl p-2 sm:p-4'>
			{images.length > 0 ? (
				<>
					{images.map((image, index) => (
						<div
							key={image + index}
							className={cn('p-1 relative aspect-square', index == 0 && 'col-span-2 row-span-2')}
						>
							<Image
								src={image}
								width={200}
								height={200}
								alt='image'
								className='rounded-lg aspect-square size-full'
							/>

							<div className='absolute top-1 end-1 p-2 flex gap-1'>
								<Checkbox
									checked={images.includes(image)}
									onCheckedChange={() => setImages((prev) => prev.filter((f) => f !== image))}
									id={image}
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
						className='w-full h-auto rounded-lg grid place-items-center p-4 bg-accent/10 text-muted-foreground'
					>
						<ImagePlusIcon className='size-full text-muted-foreground' />
					</Button>
				</>
			) : (
				<div className='size-full grid place-items-center p-4 col-span-full'>
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
				</div>
			)}

			<ImageManagerDialog open={open} setOpen={setOpen} {...props} />
		</div>
	);
}

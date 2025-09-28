'use client';

import { ImageKitFile } from '@/components/media/image-manager';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ImagePlusIcon, ImageUpIcon, InfoIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ImageManagerDialog from '../media/image-manager-dialog';
import { Button } from '../ui-custom/custom-button';
import { Checkbox } from '../ui/checkbox';

import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

	const [open, setOpen] = useState(false);

	function handelChange(files: ImageKitFile[]) {
		const data = files.map((f) => ({ fileId: f.fileId, url: f.url })) as PathValue<T, typeof name>;
		form.setValue(name, data as PathValue<T, typeof name>);
		setImages(data as PathValue<T, typeof name>);
		console.log('ImageKitFile value:', data);
	}

	// sensors
	const sensors = useSensors(useSensor(PointerSensor));

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = images.findIndex((img) => img.fileId === active.id);
		const newIndex = images.findIndex((img) => img.fileId === over.id);
		const reordered = arrayMove(images, oldIndex, newIndex);

		setImages(reordered);
		form.setValue(name, reordered as PathValue<T, typeof name>);
	}

	return (
		<div className='grid gap-3'>
			<Label aria-required={true}>{t(label)}</Label>

			<div className='min-h-60 w-full grid gap-3 p-2 sm:p-4 border-2 border-dashed rounded-xl'>
				{images.length > 0 ? (
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
						<SortableContext items={images.map((img) => img.fileId)} strategy={rectSortingStrategy}>
							<div className='grid md:grid-cols-3 lg:grid-cols-7 gap-3 max-h-96 overflow-y-auto'>
								{images.map((image, index) => (
									<SortableImageItem
										key={image.fileId}
										image={image}
										index={index}
										onRemove={() => setImages((prev) => prev.filter((f) => f.fileId !== image.fileId))}
									/>
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
						</SortableContext>
					</DndContext>
				) : (
					<div className='size-full grid place-items-center gap-4 col-span-full'>
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

				{!!images.length && (
					<span className='text-xs text-muted-foreground self-end flex items-center gap-2'>
						<InfoIcon className='size-4' />
						{t('common.messages.drag_to_reorder')}
					</span>
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

function SortableImageItem({ image, index, onRemove }: { image: ImageKitFile; index: number; onRemove: () => void }) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: image.fileId,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={cn(
				'p-1 relative aspect-square border rounded-lg cursor-grab active:cursor-grabbing first-of-type:col-span-2 first-of-type:row-span-2'
			)}
		>
			<Image
				src={image.url}
				width={200}
				height={200}
				alt='image'
				className='rounded-lg aspect-square size-full object-cover'
			/>

			<div className='absolute top-1 end-1 p-2 flex gap-1'>
				<Checkbox
					checked
					onCheckedChange={onRemove}
					id={image.fileId}
					aria-label='Remove image'
					className='scale-125 shadow shadow-accent'
				/>
			</div>
		</div>
	);
}

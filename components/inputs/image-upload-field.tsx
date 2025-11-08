'use client';

import { ImageKitFile } from '@/components/media/image-manager';
import { cn } from '@/lib/utils';
import { ImagePlusIcon, ImageUpIcon, InfoIcon, ReplaceIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
// import ImageManagerDialog from '../media/image-manager-dialog';
import { Button } from '../ui-custom/custom-button';
import { Checkbox } from '../ui/checkbox';

import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ImageManagerModal from '../media/image-manager-modal';
import { FormDescription, FormField, FormItem, FormLabel, FormMessageTranslated } from '../ui-custom/custom-form';

type ImageFieldProps<T extends FieldValues> = {
	fieldConfig: {
		name: Path<T>;
		label?: string;
		placeholder?: string;
		required?: boolean;
		multiple?: boolean;
		folder?: string;
		description?: string | undefined;
	};
	form: UseFormReturn<T>;
};

/*
	WHY: this component displays the selected images, opens ImageManagerDialog to select them,
	and supports reordering via drag-and-drop when multiple === true
*/

export default function ImageUploadField<T extends FieldValues>({
	fieldConfig: { name, label = 'forms.labels.image', description, required = false, multiple = false, folder },
	form,
}: ImageFieldProps<T>) {
	const { t } = useTranslation();

	// init images from form value
	const defaultValue = form.getValues(name);
	const [images, setImages] = useState<ImageKitFile[]>(
		Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
	);

	const [open, setOpen] = useState(false);

	// update form when images change (central sync)
	useEffect(() => {
		form.setValue(name, images as PathValue<T, typeof name>);
	}, [images, form, name]);

	// called by ImageManagerDialog when user picks images
	function handleManagerChange(files: ImageKitFile[]) {
		// add images with only fileId and url
		const data = files.map((file) => ({ fileId: file.fileId, url: file.url })) as PathValue<T, typeof name>;
		setImages(data);
		// form sync happens in useEffect above
	}

	function handleRemove(fileId: string) {
		setImages((prev) => prev.filter((i) => i.fileId !== fileId));
	}

	// ---------- DnD setup (declare hooks at top-level of component) ----------
	// const sensors = useSensors(useSensor(PointerSensor));
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5,
			},
		})
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = images.findIndex((img) => img.fileId === active.id);
		const newIndex = images.findIndex((img) => img.fileId === over.id);
		if (oldIndex < 0 || newIndex < 0) return;

		const reordered = arrayMove(images, oldIndex, newIndex);
		setImages(reordered);
		// form updated by useEffect
	}

	// ---------- render ----------
	return (
		<div className='grid gap-3'>
			<FormField
				control={form.control}
				name={name}
				render={({ field }) => (
					<FormItem>
						<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
						{/* <FormControl>
							<div className='relative'>
								<Input
									placeholder={t(placeholder as string)}
									type={showPassword ? 'text' : 'password'}
									className='pe-10'
									{...field}
								/>
								<div className='absolute top-1/2 -translate-y-1/2 end-0 ms-2 size-5 text-muted-foreground'>
									<ShowHidePasswordButton showPassword={showPassword} setShowPassword={setShowPassword} t={t} />
								</div>
							</div>
						</FormControl> */}

						<div
							onClick={() => setOpen(true)}
							className='min-h-60 w-full flex flex-col gap-3 p-2 sm:p-4 border-2 border-dashed rounded-xl'
						>
							{images.length > 0 ? (
								// only enable DnD when multiple === true and more than 1 image
								multiple && images.length > 1 ? (
									<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
										<SortableContext items={images.map((img) => img.fileId)} strategy={rectSortingStrategy}>
											<div className='grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 max-h-[460px] overflow-y-auto overflow-x-hidden flex-1'>
												{images.map((image, index) => (
													<SortableImageItem
														key={image.fileId}
														image={image}
														selected={images.some((i) => i.fileId === image.fileId)}
														onRemove={() => handleRemove(image.fileId)}
													/>
												))}

												<Button
													type='button'
													onClick={() => setOpen(true)}
													variant='ghost'
													className='w-full h-auto rounded-lg grid place-items-center p-4 bg-accent/10 text-muted-foreground aspect-square'
												>
													<ImagePlusIcon className='size-full text-muted-foreground' />
												</Button>
											</div>
										</SortableContext>
									</DndContext>
								) : (
									// non-dnd fallback (single image or multiple disabled) — show static grid
									<div className='grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 max-h-[400px] overflow-y-auto'>
										{images.map((image) => (
											<StaticImageItem
												key={image.fileId}
												image={image}
												selected={images.some((i) => i.fileId === image.fileId)}
												onRemove={() => handleRemove(image.fileId)}
											/>
										))}

										<Button
											type='button'
											onClick={() => setOpen(true)}
											variant='ghost'
											className='w-full h-auto rounded-lg grid place-items-center p-4 bg-accent/10 text-muted-foreground aspect-square'
											aria-label={
												!multiple && images.length
													? t('forms.placeholders.change_image')
													: t('forms.placeholders.upload_image')
											}
											title={
												!multiple && images.length
													? t('forms.placeholders.change_image')
													: t('forms.placeholders.upload_image')
											}
										>
											{!multiple && images.length ? (
												<ReplaceIcon className='size-full text-muted-foreground' />
											) : (
												<ImagePlusIcon className='size-full text-muted-foreground' />
											)}
										</Button>
									</div>
								)
							) : (
								<div className='size-full  flex flex-col justify-center items-center gap-4 col-span-full rounded-xl hover:bg-accent/10 transition-all'>
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

									<p className='text-xs text-muted-foreground text-center'>
										{multiple ? t('forms.infos.upload_image_multiple') : t('forms.infos.upload_image_single')}
									</p>
								</div>
							)}

							{images.length > 1 && (
								<span className='text-xs text-muted-foreground flex items-center gap-2'>
									<InfoIcon className='size-4' />
									{t('common.messages.drag_to_reorder')}
								</span>
							)}
						</div>

						{description && <FormDescription>{t(description as string)}</FormDescription>}
						<FormMessageTranslated />
					</FormItem>
				)}
			/>

			{/* <ImageManagerDialog */}
			<ImageManagerModal
				open={open}
				setOpen={setOpen}
				value={images}
				multiple={multiple}
				folder={folder}
				onChange={handleManagerChange}
			/>
		</div>
	);
}

/* --------------------------
   Sortable item (drag handle separate so checkbox receives events)
   -------------------------- */
function SortableImageItem({
	image,
	selected,
	onRemove,
}: {
	image: ImageKitFile;
	selected: boolean;
	onRemove: (checked: boolean) => void;
}) {
	const { t } = useTranslation();
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.fileId });

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
				'touch-none p-1 relative aspect-square border rounded-lg cursor-grab active:cursor-grabbing first-of-type:col-span-2 first-of-type:row-span-2'
			)}
			aria-label={t('common.messages.drag_to_reorder')}
		>
			<Image
				src={image.url}
				width={200}
				height={200}
				alt={t('forms.placeholders.select_image')}
				className='rounded-lg aspect-square size-full object-cover'
			/>

			<div className='absolute top-1 end-1 p-2 flex gap-1'>
				{/* prevent pointer events bubbling to DnD: wrapper stops propagation */}
				<div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
					<Checkbox
						checked={!!selected}
						onCheckedChange={(val) => onRemove(!!val)}
						id={image.fileId}
						aria-label='Select image'
						className='scale-125 shadow shadow-accent'
					/>
				</div>
			</div>
		</div>
	);
}

/* Static (non-sortable) item used when DnD disabled */
function StaticImageItem({
	image,
	selected,
	onRemove,
}: {
	image: ImageKitFile;
	selected: boolean;
	onRemove: (checked: boolean) => void;
}) {
	const { t } = useTranslation();

	return (
		<div className={cn('p-1 relative aspect-square border rounded-lg first-of-type:col-span-2 first-of-type:row-span-2')}>
			<Image
				src={image.url}
				width={200}
				height={200}
				alt={t('forms.placeholders.upload_image')}
				className='rounded-lg aspect-square w-full object-cover'
			/>

			<div className='absolute top-1 end-1 p-2 flex gap-1'>
				<div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
					<Checkbox
						checked={!!selected}
						onCheckedChange={(val) => onRemove(!!val)}
						id={image.fileId}
						aria-label={t('forms.placeholders.select_image')}
						className='scale-125 shadow shadow-accent'
					/>
				</div>
			</div>
		</div>
	);
}

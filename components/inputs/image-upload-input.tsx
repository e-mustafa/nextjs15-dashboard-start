'use client';
import { ImageKitFile } from '@/components/media/image-manager';
import { cn } from '@/lib/utils';
import { TImage } from '@/types/api';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImagePlusIcon, ImageUpIcon, InfoIcon, ReplaceIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageManagerModal from '../media/image-manager-modal';
import { Button } from '../ui-custom/custom-button';
import { Checkbox } from '../ui/checkbox';

type ImageInputProps = {
	field: {
		value: ImageKitFile[] | TImage[];
		onChange: (files: ImageKitFile[] | TImage[]) => void;
		placeholder?: string;
		multiple?: boolean;
		folder?: string;
		// accept?: string;
		// maxSize?: number;
		// class?: string;
	};
};

/**
 * ImageUploadInput is a component that displays the selected images, opens ImageManagerDialog to select them,
 * and supports reordering via drag-and-drop when multiple === true
 *
 * @param {ImageInputProps} props
 * @param {ImageKitFile[] | TImage[]} props.field.value - The value of the input field
 * @param {(files: ImageKitFile[] | TImage[]) => void} props.field.onChange - The onChange function of the input field
 * @param {string} props.field.placeholder - The placeholder of the input field
 * @param {boolean} props.field.multiple - If true, allow selecting multiple images
 * @param {string} props.field.folder - The folder to select images from. If not provided, the ImageManager will open the root folder
 * @returns {JSX.Element} - The component
 */
export default function ImageUploadInput({
	field: { value, onChange, placeholder, multiple, folder, ...rest },
}: ImageInputProps) {
	const { t } = useTranslation();

	// init images from form value
	const [images, setImages] = useState<TImage[]>([]);

	console.log('images-', images);

	const [open, setOpen] = useState(false);

	// useRef is used to track if the change is internal
	const isInternalChangeRef = useRef(false);

	// sync form value with images when component mounts (initial load from external value)
	useEffect(() => {
		// skip if the change is internal
		if (isInternalChangeRef.current) {
			isInternalChangeRef.current = false;
			return;
		}

		// Update images when value changes
		if (value && Array.isArray(value) && value.length > 0) {
			const formattedValue = value.map((file) => ({
				fileId: file?.fileId,
				url: file?.url,
			})) as TImage[];

			// check if there is a difference before updating
			const isDifferent = JSON.stringify(formattedValue) !== JSON.stringify(images);
			if (isDifferent) {
				setImages(formattedValue);
			}
		} else if (value?.length === 0 && images.length > 0) {
			// clear images if value is empty
			setImages([]);
		}
	}, [value]);

	// update form value when images change when internal change
	useEffect(() => {
		if (isInternalChangeRef.current) {
			onChange?.(images);
		}
	}, [images, onChange]);

	console.log('images-', images);

	function handleManagerChange(files: ImageKitFile[] | TImage[]) {
		const data = files.map((file) => ({ fileId: file?.fileId, url: file?.url }));
		isInternalChangeRef.current = true;
		setImages(data as TImage[]);
	}

	function handleRemove(fileId: string) {
		isInternalChangeRef.current = true;
		setImages((prev: TImage[]) => prev.filter((img: TImage) => img?.fileId !== fileId));
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

		const oldIndex = images.findIndex((img) => img?.fileId === active.id);
		const newIndex = images.findIndex((img) => img?.fileId === over.id);
		if (oldIndex < 0 || newIndex < 0) return;

		const reordered = arrayMove(images, oldIndex, newIndex);
		setImages(reordered);
		// form updated by useEffect
	}

	// ---------- render ----------
	return (
		<>
			<div
				// aria-invalid={fieldControl.error ? true : false}
				{...rest}
				onClick={() => setOpen(true)}
				className='min-h-60 w-full flex flex-col gap-3 p-2 sm:p-4 border-2 border-dashed rounded-xl aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
			>
				{images.length > 0 ? (
					// only enable DnD when multiple === true and more than 1 image
					multiple && images.length > 1 ? (
						<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
							<SortableContext items={images.map((img) => img?.fileId!)} strategy={rectSortingStrategy}>
								<div className='grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 max-h-[460px] overflow-y-auto overflow-x-hidden flex-1'>
									{images.map((image, index) => (
										<SortableImageItem
											key={image?.fileId}
											image={image}
											selected={images.some((img) => img?.fileId === image?.fileId)}
											onRemove={() => handleRemove(image?.fileId!)}
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
									key={image?.fileId}
									image={image}
									selected={images.some((img) => img?.fileId === image?.fileId)}
									onRemove={() => handleRemove(image?.fileId!)}
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
							variant='outline'
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

			{/* <ImageManagerDialog */}
			<ImageManagerModal
				open={open}
				setOpen={setOpen}
				// value={images as ImageKitFile[]}
				value={images as ImageKitFile[]}
				multiple={multiple}
				folder={folder}
				onChange={handleManagerChange}
			/>
		</>
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
	image: ImageKitFile | TImage;
	selected: boolean;
	onRemove: (checked: boolean) => void;
}) {
	const id = useId();
	const { t } = useTranslation();
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image?.fileId + id });

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
				src={image?.url!}
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
						id={image?.fileId}
						aria-label={t('forms.placeholders.select_image')}
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
	image: ImageKitFile | TImage;
	selected: boolean;
	onRemove: (checked: boolean) => void;
}) {
	const { t } = useTranslation();

	return (
		<div className={cn('p-1 relative aspect-square border rounded-lg first-of-type:col-span-2 first-of-type:row-span-2')}>
			<Image
				src={image?.url!}
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
						id={image?.fileId}
						aria-label={t('forms.placeholders.select_image')}
						className='scale-125 shadow shadow-accent'
					/>
				</div>
			</div>
		</div>
	);
}

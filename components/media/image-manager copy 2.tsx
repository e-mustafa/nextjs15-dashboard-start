'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import clsx from 'clsx';
import { ImageUpIcon, Loader2, Pencil, Trash, Upload } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------
// Types
// ---------------------------------------------
export type ImageKitFile = {
	fileId: string;
	name: string;
	url: string;
	thumbnailUrl?: string;
	height?: number;
	width?: number;
	size?: number;
	fileType?: string;
	folderPath?: string;
	createdAt?: string;
};

export interface ImageManagerProps {
	/** allow selecting single or multiple images */
	multiple?: boolean;
	/** optionally confine operations to a folder */
	folder?: string;
	/** callback when selection changes */
	onChange?: (files: ImageKitFile[]) => void;
	/** initial selected files */
	value?: ImageKitFile[];
}

const apiImagekitUrl = '/api/imagekit';

export default function ImageManager({ multiple = true, folder, onChange, value = [] }: ImageManagerProps) {
	const [files, setFiles] = useState<ImageKitFile[]>([]); // all fetched files (from ImageKit)
	const [selected, setSelected] = useState<ImageKitFile[]>(value);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [skip, setSkip] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const { t } = useTranslation();

	// ------------------------
	// Fetch list
	// ------------------------
	const fetchFiles = async (opts?: { reset?: boolean }) => {
		if (loading) return;
		setLoading(true);
		try {
			const params = new URLSearchParams({
				search,
				skip: String(opts?.reset ? 0 : skip),
				limit: '40',
				...(folder ? { folder } : {}),
			});
			const res = await fetch(`${apiImagekitUrl}/list?${params.toString()}`);
			console.log('list res:', res);
			if (!res.ok) throw new Error('Failed to load files');
			const data: ImageKitFile[] = await res.json();

			if (opts?.reset) {
				setFiles(data);
				setSkip(40);
			} else {
				setFiles((prev) => [...prev, ...data]);
				setSkip((s) => s + 40);
			}
			setHasMore(data.length === 40);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// fetch first load
		fetchFiles({ reset: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Debounce search
	useEffect(() => {
		const t = setTimeout(() => {
			fetchFiles({ reset: true });
		}, 400);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, folder]);

	// Notify parent when selected changes
	useEffect(() => {
		onChange?.(selected);
	}, [selected]);

	// ------------------------
	// Upload (supports drag & drop + button)
	// ------------------------
	const handleUploadFiles = async (files: File[]) => {
		setUploading(true);
		try {
			const promises = files.map(async (file) => {
				const form = new FormData();
				form.append('file', file);
				form.append('fileName', file.name);
				if (folder) form.append('folder', folder);
				const res = await fetch(`${apiImagekitUrl}/upload`, {
					method: 'POST',
					body: form,
				});
				console.log('upload res:', res);
				if (!res.ok) throw new Error('Upload failed');
				return (await res.json()) as ImageKitFile;
			});
			const uploaded = await Promise.all(promises);

			// Put them at the top (first image highlighted)
			setFiles((prev) => [...uploaded, ...prev]);

			// Auto-select if user wants selection
			if (multiple) {
				setSelected((prev) => [...uploaded, ...prev]);
			} else if (uploaded[0]) {
				setSelected([uploaded[0]]);
			}
		} finally {
			setUploading(false);
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		multiple: true,
		accept: { 'image/*': [] },
		onDrop: handleUploadFiles,
	});

	const openFilePicker = () => inputRef.current?.click();

	const toggleSelect = (file: ImageKitFile, index: number) => {
		if (!multiple) {
			setSelected([file]);
			return;
		}
		const exists = selected.find((f) => f.fileId === file.fileId);
		if (exists) {
			setSelected(selected.filter((f) => f.fileId !== file.fileId));
		} else {
			// Maintain order: put newly selected item at the end
			setSelected([...selected, file]);
		}
	};

	// Drag to reorder *selected* images locally (Shopify-like UX)
	const moveSelected = (fromIndex: number, toIndex: number) => {
		setSelected((curr) => {
			const copy = [...curr];
			const [moved] = copy.splice(fromIndex, 1);
			copy.splice(toIndex, 0, moved);
			return copy;
		});
	};

	const deleteFile = async (fileId: string) => {
		const res = await fetch(`${apiImagekitUrl}/delete`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileId }),
		});
		console.log('delete res:', res);
		if (!res.ok) return;
		setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
		setSelected((prev) => prev.filter((f) => f.fileId !== fileId));
	};

	const renameFile = async (fileId: string, newFileName: string) => {
		const res = await fetch(`${apiImagekitUrl}/rename`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileId, newFileName }),
		});
		console.log('rename res:', res);
		if (!res.ok) return;
		const data = (await res.json()) as ImageKitFile;
		setFiles((prev) => prev.map((f) => (f.fileId === fileId ? { ...f, ...data, name: newFileName } : f)));
		setSelected((prev) => prev.map((f) => (f.fileId === fileId ? { ...f, ...data, name: newFileName } : f)));
	};

	const filteredFiles = useMemo(() => files, [files]); // server already filters by name

	return (
		<div className='space-y-4 pt-4 sm:pt-0 h-full'>
			{/* Toolbar */}
			<div className='flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between'>
				<div className='flex items-center gap-2'>
					<Input
						placeholder='Search images...'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className='w-64 flex-auto'
					/>
					<Button variant='outline' onClick={() => fetchFiles({ reset: true })} disabled={loading}>
						{loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />} Refresh
					</Button>
				</div>
				<div className='flex items-center gap-2'>
					<input
						ref={inputRef}
						type='file'
						accept='image/*'
						multiple={multiple}
						onChange={(e) => handleUploadFiles(Array.from(e.target.files ?? []))}
						className='hidden'
					/>
					<Button onClick={openFilePicker} disabled={uploading}>
						{uploading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Upload className='mr-2 h-4 w-4' />}
						Upload {multiple ? 'images' : 'image'}
					</Button>
				</div>
			</div>

			{/* Dropzone */}
			<div
				{...getRootProps()}
				className={clsx(
					'flex items-center justify-center gap-3 border border-dashed rounded-xl p-6 text-center cursor-pointer text-muted-foreground text-sm',
					isDragActive ? 'bg-accent/30' : 'bg-muted'
				)}
			>
				<input {...getInputProps()} />
				<ImageUpIcon className='h-8 w-8 text-muted-foreground' />
				<p>{t(isDragActive ? 'forms.placeholders.image_on_drag' : 'forms.placeholders.image_drag_and_drop')}</p>
				<div className='flex gap-2 p-2'>
					{value.map((img) => (
						<div key={img.fileId} className='relative overflow-hidden p-2'>
							<Image src={img.url} alt={img.name} width={100} height={100} />
						</div>
					))}
					<Button variant='ghost' className='h-8 w-8'>
						<ImageUpIcon className='h-8 w-8 text-muted-foreground' />
					</Button>
				</div>
			</div>

			{/* Selected (sortable) */}
			{selected.length > 0 && (
				<section>
					<h3 className='mb-2 text-sm font-medium text-muted-foreground'>Selected images (drag to reorder)</h3>
					<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'>
						{selected.map((img, index) => (
							<div
								key={img.fileId}
								className={clsx('relative group overflow-hidden', index === 0 ? 'col-span-2 row-span-2' : '')}
								draggable
								onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
								onDragOver={(e) => e.preventDefault()}
								onDrop={(e) => {
									const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
									moveSelected(fromIndex, index);
								}}
							>
								<img src={img.url} alt={img.name} className='w-full h-full object-cover rounded' />
								<div className='absolute bottom-2 left-2 right-2 bg-background/80 rounded p-1 text-xs flex items-center justify-between gap-1'>
									<span className='truncate'>{img.name}</span>
									<div className='flex gap-1'>
										<RenameDialog file={img} onRename={renameFile} />
										<Button size='icon' variant='ghost' className='h-5 w-5' onClick={() => deleteFile(img.fileId)}>
											<Trash className='h-3 w-3 text-destructive' />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{/* Library */}
			<section className='h-full flex flex-col gap-4'>
				<h3 className='mb-2 text-sm font-medium text-muted-foreground'>Library</h3>
				{filteredFiles.length === 0 && !loading && <p className='text-muted-foreground text-sm'>No images found.</p>}
				<div className='grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'>
					{filteredFiles.map((img, index) => {
						const active = !!selected.find((f) => f.fileId === img.fileId);
						return (
							<div
								key={img.fileId}
								className={clsx(
									'relative group overflow-hidden p-2',
									index === 0 ? 'col-span-2 row-span-2' : '',
									active && 'ring-2 ring-primary'
								)}
								onClick={() => toggleSelect(img, index)}
							>
								
									<img src={img.url} alt={img.name} className='w-full h-full object-cover rounded' />
									<div className='absolute bottom-2 left-2 right-2 bg-background/80 rounded p-1 text-xs flex items-center justify-between gap-1'>
										<span className='truncate'>{img.name}</span>
										<div className='flex gap-1'>
											<RenameDialog file={img} onRename={renameFile} />
											<Button
												size='icon'
												variant='ghost'
												className='h-5 w-5'
												onClick={(e) => {
													e.stopPropagation();
													deleteFile(img.fileId);
												}}
											>
												<Trash className='h-3 w-3 text-destructive' />
											</Button>
										</div>
									</div>
							</div>
						);
					})}
				</div>

				{/* Load more */}
				{hasMore && (
					<div className='flex justify-center mt-4'>
						<Button onClick={() => fetchFiles()} disabled={loading} variant='ghost'>
							{loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
							Load more
						</Button>
					</div>
				)}
			</section>
		</div>
	);
}

function RenameDialog({
	file,
	onRename,
}: {
	file: ImageKitFile;
	onRename: (fileId: string, newName: string) => Promise<void>;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(file.name);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size='icon' variant='ghost' className='h-5 w-5'>
					<Pencil className='h-3 w-3' />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename</DialogTitle>
				</DialogHeader>
				<div className='space-y-3'>
					<Input value={name} onChange={(e) => setName(e.target.value)} />
					<Button
						onClick={async () => {
							await onRename(file.fileId, name);
							setOpen(false);
						}}
					>
						Save
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

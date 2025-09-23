'use client';

import { ImageUpIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/use-file-upload';
import { cn } from '@/lib/utils';

export default function UploadImage() {
	const [
		{ files, isDragging },
		{ removeFile, openFileDialog, getInputProps, handleDragEnter, handleDragLeave, handleDragOver, handleDrop },
	] = useFileUpload({
		accept: 'image/*',
		maxFiles: 1,
		// maxFileSize: 5 * 1024 * 1024, // 5MB
		multiple: false,
	});

	console.log('files', files);

	const previewUrl = files[0]?.preview || null;

	return (
		<div className='flex flex-col items-center gap-2'>
			<div className={cn(files.length > 0 ? '!w-32' : '!w-full', 'h-32 relative flex w-full justify-center')}>
				{/* Drop area */}
				<button
					type='button'
					className='!size-full border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 relative flex items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors outline-none focus-visible:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none'
					onClick={openFileDialog}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					data-dragging={isDragging || undefined}
					aria-label={previewUrl ? 'Change image' : 'Upload image'}
				>
					{previewUrl ? (
						<img
							className='object-cover aspect-square'
							src={previewUrl}
							alt={files[0]?.file?.name || 'Uploaded image'}
							width={128}
							height={128}
							style={{ objectFit: 'cover' }}
						/>
					) : (
						<div aria-hidden='true'>
							<ImageUpIcon className='size-16 opacity-60' />
						</div>
					)}
				</button>
				{previewUrl && (
					<Button
						onClick={() => removeFile(files[0]?.id)}
						size='icon'
						className='border-background focus-visible:border-background absolute -top-1 -right-1 size-6 rounded-full border-2 shadow-none'
						aria-label='Remove image'
					>
						<XIcon className='size-3.5' />
					</Button>
				)}
				<input {...getInputProps()} className='sr-only' aria-label='Upload image file' tabIndex={-1} />
			</div>
			<p className='text-xs text-muted-foreground line-clamp-1 h-4'>{files[0]?.file.name}</p>
			{/* <p
				aria-live="polite"
				role="region"
				className="text-muted-foreground mt-2 text-xs"
				>
				Avatar uploader with droppable area ∙{" "}
				<a
					href="https://github.com/origin-space/originui/tree/main/docs/use-file-upload.md"
					className="hover:text-foreground underline"
				>
					API
				</a>
			</p> */}
		</div>
	);
}

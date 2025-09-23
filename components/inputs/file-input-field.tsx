'use client';

import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { FileUploadOptions, FileWithPreview, useFileUpload } from '@/hooks/use-file-upload';
import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { cn } from '@/lib/utils';
import { ImageUpIcon, XIcon } from 'lucide-react';
import { JSX } from 'react';
import { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormMessageTranslated } from '../ui-custom/custom-form';
import InfoIconTooltip from './info-icon-tooltip';

export function FileInputField<T extends FieldValues, K extends keyof FieldTypeMap>({
	fieldConfig,
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const {
		name,
		label,
		required,
		description,
		file: { accept = 'image/*', maxSize = 5 * 1024 * 1024, multiple = false } = {},
	} = fieldConfig;

	const { t } = useTranslation();

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => {
				const [
					{ files, isDragging },
					{ removeFile, openFileDialog, getInputProps, handleDragEnter, handleDragLeave, handleDragOver, handleDrop },
				] = useFileUpload({
					accept,
					maxSize: maxSize,
					maxFiles: multiple ? undefined : 1,
					multiple,
					onFilesChange: (newFiles) => {
						field.onChange(multiple ? newFiles : newFiles[0] ?? null);
					},
				} as FileUploadOptions);

				const value = field.value as FileWithPreview | FileWithPreview[] | string | undefined;

				console.log('value', value);

				const previewUrl =
					typeof value !== 'string' ? (Array.isArray(value) ? value[0]?.preview : value?.preview) : value;

				return (
					<FormItem>
						{!fieldConfig.infoContent ? (
							<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
						) : (
							// info icon
							<div className='relative flex items-center justify-between h-3.5'>
								<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>

								<InfoIconTooltip
									info={t(fieldConfig.infoContent as string) || ''}
									t={t}
									Icon={fieldConfig.InfoIcon && fieldConfig.InfoIcon}
								/>
							</div>
						)}
						<FormControl>
							<div className='flex flex-col items-center gap-2'>
								<div className={cn(previewUrl ? '!w-32' : '!w-full', 'h-32 relative flex w-full justify-center')}>
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
												alt='Uploaded preview'
												width={128}
												height={128}
												style={{ objectFit: 'cover' }}
											/>
										) : (
											<ImageUpIcon className='size-16 opacity-60' />
										)}
									</button>
									{previewUrl && (
										<Button
											onClick={() => {
												removeFile(files[0]?.id);
												field.onChange(null);
											}}
											size='icon'
											className='border-background focus-visible:border-background absolute -top-1 -right-1 size-6 rounded-full border-2 shadow-none'
											aria-label='Remove image'
										>
											<XIcon className='size-3.5' />
										</Button>
									)}
									<input {...getInputProps()} className='sr-only' aria-label='Upload image file' tabIndex={-1} />
								</div>
								{files[0]?.file && (
									<p className='text-xs text-muted-foreground line-clamp-1 h-4'>{files[0].file.name}</p>
								)}
							</div>
						</FormControl>
						{description && <FormDescription>{t(description)}</FormDescription>}
						<FormMessageTranslated />
					</FormItem>
				);
			}}
		/>
	);
}

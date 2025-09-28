'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '../ui-custom/custom-button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui-custom/modal';
import { Drawer, DrawerContent } from '../ui/drawer';
import ImageManager, { ImageManagerProps } from './image-manager';

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

export interface props extends ImageManagerProps {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	/** allow selecting single or multiple images */
	multiple?: boolean;
	/** optionally confine operations to a folder */
	folder?: string;
	/** callback when selection changes */
	onChange?: (files: ImageKitFile[]) => void;
	/** initial selected files */
	value?: ImageKitFile[];
}

export default function ImageManagerDialog({ open, setOpen, multiple = true, folder, onChange, value = [] }: props) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerContent>
					<ImageManager multiple={multiple} folder={folder} onChange={onChange} value={value} />
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{/* <DialogTrigger asChild>
				<Button size='icon' variant='ghost' className='h-5 w-5'>
					<ImageUpIcon className='h-3 w-3' />
				</Button>
			</DialogTrigger> */}
			<DialogContent className='sm:max-w-3xl'>
				<DialogHeader className='h-fit'>
					<DialogTitle>Share link</DialogTitle>
					<DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
				</DialogHeader>
				<div className='overflow-y-auto h-[60dvh]'>
					<ImageManager multiple={multiple} folder={folder} onChange={onChange} value={value} />
				</div>
				<DialogFooter>
					<Button onClick={() => setOpen?.(false)}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

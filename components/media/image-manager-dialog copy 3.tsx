'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '../ui-custom/custom-button';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui-custom/modal';
import { useRef, useState } from 'react';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog';
import { Drawer, DrawerContent } from '../ui/drawer';
import ImageManager from './image-manager';

export default function ImageManagerDialog({ open, setOpen, multiple = true, folder, onChange, value = [] }: props) {
	const [hasReadToBottom, setHasReadToBottom] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	const handleScroll = () => {
		const content = contentRef.current;
		if (!content) return;

		const scrollPercentage = content.scrollTop / (content.scrollHeight - content.clientHeight);
		if (scrollPercentage >= 0.99 && !hasReadToBottom) {
			setHasReadToBottom(true);
		}
	};
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
			<DialogContent className='flex flex-col gap-0 p-0 sm:max-h-[600dvh] sm:max-w-3xl [&>button:last-child]:top-3.5'>
				<DialogHeader className='contents space-y-0 text-start'>
					<DialogTitle className='border-b px-6 py-4 text-base'>Terms & Conditions</DialogTitle>
					<div ref={contentRef} onScroll={handleScroll} className='overflow-y-auto'>
						<DialogDescription asChild>
							<div className='px-6 py-4'>
								<div className='[&_strong]:text-foreground space-y-4 [&_strong]:font-semibold'>
									<ImageManager multiple={multiple} folder={folder} onChange={onChange} value={value} />
								</div>
							</div>
						</DialogDescription>
					</div>
				</DialogHeader>
				<DialogFooter className='border-t px-6 py-4 sm:items-center'>
					<DialogClose asChild>
						<Button type='button' variant='outline'>
							Cancel
						</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button type='button' disabled={!hasReadToBottom}>
							I agree
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

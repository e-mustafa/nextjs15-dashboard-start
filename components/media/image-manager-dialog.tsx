'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui-custom/custom-button';
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '../ui-custom/modal';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter } from '../ui/drawer';
import ImageManager, { ImageManagerProps } from './image-manager';

// ---------------------------------------------
// Types
// ---------------------------------------------

export interface props extends ImageManagerProps {
	open?: boolean;
	setOpen?: (open: boolean) => void;
}
export default function ImageManagerDialog({ open, setOpen, ...rest }: props) {
	const isMobile = useIsMobile();
	const { t } = useTranslation();

	// const [hasReadToBottom, setHasReadToBottom] = useState(false);
	// const contentRef = useRef<HTMLDivElement>(null);

	// const handleScroll = () => {
	// 	const content = contentRef.current;
	// 	if (!content) return;

	// 	const scrollPercentage = content.scrollTop / (content.scrollHeight - content.clientHeight);
	// 	if (scrollPercentage >= 0.99 && !hasReadToBottom) {
	// 		setHasReadToBottom(true);
	// 	}
	// };

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerContent className='px-4'>
					<ImageManager onDoubleClick={() => setOpen?.(false)} {...rest} />
					<DrawerFooter>
						<DrawerClose asChild>
							<Button type='button' variant='outline' onClick={() => setOpen?.(false)}>
								{t('common.actions.close')}
							</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent size='5xl'>
				<ModalHeader>
					<ModalTitle>{t('common.sections.images_library')}</ModalTitle>
					<ModalDescription>{t('common.sections.images_library_description')}</ModalDescription>
				</ModalHeader>
				<ImageManager onDoubleClick={() => setOpen?.(false)} {...rest} />
				<ModalFooter className='py-2'>
					<Button type='button' variant='outline' onClick={() => setOpen?.(false)}>
						{t('common.actions.close')}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

'use client';

import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from './custom-button';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
type ModalHeightState = 'half' | 'full';

const sizeClasses: Record<ModalSize, string> = {
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-lg',
	xl: 'max-w-xl',
	'2xl': 'max-w-2xl',
	'3xl': 'max-w-3xl',
	'4xl': 'max-w-4xl',
	'5xl': 'max-w-5xl',
	full: 'max-w-[calc(100%-2rem)] sm:max-w-[90dvw] h-[90dvh]',
};

export function Modal(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root {...props} />;
}

export function ModalTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger {...props} />;
}

export function ModalClose({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return (
		<DialogPrimitive.Close
			className={cn(
				'inline-flex items-center justify-center rounded-md text-sm font-medium transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none opacity-70',
				className
			)}
			{...props}
		>
			{children ?? <XIcon className='size-4' />}
		</DialogPrimitive.Close>
	);
}

export function ModalHeader({
	className,
	children,
	showCloseButton = true,
}: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
	return (
		<div
			data-slot='dialog-header'
			className={cn('flex gap-4 bg-muted/30 sm:bg-muted rounded-t-lg p-2 md:p-4 md:px-6 shadow-lg', className)}
		>
			<div className='flex flex-col gap-2 text-center sm:text-start grow'>{children}</div>
			{showCloseButton && (
				<DialogPrimitive.Close asChild data-slot='dialog-close'>
					<Button size='icon' variant='ghost'>
						<XIcon />
						<span className='sr-only'>Close</span>
					</Button>
				</DialogPrimitive.Close>
			)}
		</div>
	);
}

export function ModalFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
	return (
		<div className={cn('flex items-center justify-end bg-muted px-4 py-2', className)} {...props}>
			{children}
		</div>
	);
}

export function ModalTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return <DialogPrimitive.Title className={cn('text-lg leading-none font-semibold', className)} {...props} />;
}

export function ModalDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return <DialogPrimitive.Description className={cn('text-muted-foreground text-xs md:text-sm', className)} {...props} />;
}

interface ModalContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
	size?: ModalSize;
	children: React.ReactNode;
	mobileBehavior?: 'modal' | 'drawer';
}

export function ModalContent({ className, children, size = 'lg', mobileBehavior = 'drawer', ...props }: ModalContentProps) {
	const contentRef = React.useRef<HTMLDivElement>(null);
	const [translateY, setTranslateY] = React.useState(0);
	const [startY, setStartY] = React.useState<number | null>(null);
	const [heightState, setHeightState] = React.useState<ModalHeightState>('half');
	const [isDragging, setIsDragging] = React.useState(false);

	const handleTouchStart = (e: React.TouchEvent) => {
		if (window.innerWidth >= 640 || mobileBehavior !== 'drawer') return;
		setStartY(e.touches[0].clientY);
		setIsDragging(true);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging || startY === null) return;
		const delta = e.touches[0].clientY - startY;
		if (delta > 0 || heightState === 'half') setTranslateY(delta);
	};

	const handleTouchEnd = () => {
		if (!isDragging) return;
		setIsDragging(false);

		if (translateY > 120) {
			// إغلاق عند السحب للأسفل كثيرًا
			const closeButton = contentRef.current?.querySelector('[data-slot="dialog-close"]') as HTMLElement;
			closeButton?.click();
		} else if (translateY < -100) {
			// تمدد للأعلى عند السحب لأعلى
			setHeightState('full');
		} else if (translateY > 30 && heightState === 'full') {
			// العودة للنصف عند السحب للأسفل قليلاً
			setHeightState('half');
		}

		setTranslateY(0);
	};

	const header = React.Children.toArray(children).find(
		(child): child is React.ReactElement<typeof ModalHeader> => React.isValidElement(child) && child.type === ModalHeader
	);
	const footer = React.Children.toArray(children).find(
		(child): child is React.ReactElement<typeof ModalFooter> => React.isValidElement(child) && child.type === ModalFooter
	);
	const body = React.Children.toArray(children).filter(
		(child) => React.isValidElement(child) && child.type !== ModalHeader && child.type !== ModalFooter
	);

	return (
		<DialogPrimitive.Portal>
			{/* Overlay */}
			<DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out' />

			{/* Content */}
			<DialogPrimitive.Content
				ref={contentRef}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				style={{
					transform: mobileBehavior === 'drawer' && window.innerWidth < 640 ? `translateY(${translateY}px)` : undefined,
					transition: isDragging ? 'none' : 'transform 0.25s ease, height 0.25s ease',
					height:
						mobileBehavior === 'drawer' && window.innerWidth < 640
							? heightState === 'full'
								? '95dvh'
								: '60dvh'
							: undefined,
				}}
				className={cn(
					'fixed z-50 flex flex-col bg-background shadow-lg border border-border overflow-hidden',
					// Desktop modal
					'sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg',
					// Mobile drawer
					'bottom-0 left-0 w-full rounded-t-2xl sm:rounded-lg sm:w-autoxx sm:h-auto transition-all',
					sizeClasses[size],
					className
				)}
				{...props}
			>
				{/* Handle bar */}
				{mobileBehavior === 'drawer' && (
					<div className='sm:hidden flex justify-center py-2 cursor-grab active:cursor-grabbing'>
						<div className='w-12 h-1.5 bg-muted-foreground/40 rounded-full' />
					</div>
				)}

				{header ?? <ModalHeader />}
				<div className='grow overflow-y-auto px-3 py-4'>{body}</div>
				{footer ?? <ModalFooter />}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

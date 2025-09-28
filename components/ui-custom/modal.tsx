// app/components/ui/modal.tsx
'use client';

import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from './custom-button';

// ===== Root =====
function Modal(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root {...props} />;
}

// ===== Trigger =====
function ModalTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger {...props} />;
}

// ===== Close =====
function ModalClose({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
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

// ===== Header =====
// function ModalHeader({ className, children, ...props }: React.ComponentProps<'div'>) {
// 	return (
// 		<div className={cn('flex items-center justify-between bg-muted px-4 py-2', className)} {...props}>
// 			<div className='font-semibold text-base'>{children}</div>
// 			<ModalClose />
// 		</div>
// 	);
// }

function ModalHeader({
	className,
	children,
	showCloseButton = true,
	...props
}: React.ComponentProps<'div'> & {
	showCloseButton?: boolean;
}) {
	return (
		<div data-slot='dialog-header' className={cn('flex gap-4 bg-muted rounded-t-lg p-4 md: px-6 shadow-lg', className)} {...props}>
			<div className='flex flex-col gap-2 text-center sm:text-start grow'>{children}</div>
			{showCloseButton && (
				<DialogPrimitive.Close
					asChild
					data-slot='dialog-close'
					className="ring-offset-background focus:ring-ring opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
				>
					<Button
						size='icon'
						variant='ghost'
						className=' data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'
					>
						<XIcon />
						<span className='sr-only'>Close</span>
					</Button>
				</DialogPrimitive.Close>
			)}
		</div>
	);
}

function ModalTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot='dialog-title'
			className={cn('text-lg leading-none font-semibold', className)}
			{...props}
		/>
	);
}

function ModalDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot='dialog-description'
			className={cn('text-muted-foreground text-sm', className)}
			{...props}
		/>
	);
}

// ===== Footer =====
function ModalFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
	return (
		<div className={cn('flex items-center justify-end bg-muted px-4 py-2', className)} {...props}>
			{children}
		</div>
	);
}

// ===== Variants =====
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

const sizeClasses: Record<ModalSize, string> = {
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-lg',
	xl: 'max-w-xl',
	'2xl': 'max-w-2xl',
	'3xl': 'max-w-3xl',
	'4xl': 'max-w-4xl',
	'5xl': 'max-w-5xl',
	full: 'max-w-[calc(100%-2rem)] sm:max-w-[90vw] h-[90vh]',
};

// ===== Content =====
interface ModalContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
	size?: ModalSize;
	children: React.ReactNode;
}

function ModalContent({ className, children, size = 'lg', ...props }: ModalContentProps) {
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
			<DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
			<DialogPrimitive.Content
				className={cn(
					'fixed top-1/2 left-1/2 z-50 translate-x-[-50%] translate-y-[-50%] flex flex-col justify-between gap-0 p-0 w-full overflow-hidden rounded-lg border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
					sizeClasses[size],
					className
				)}
				{...props}
			>
				{header ?? <ModalHeader />}
				<div className='grow'>
					<div className='px-6 py-4 overflow-y-auto h-[70dvh]'>{body}</div>
				</div>
				{footer ?? <ModalFooter />}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

export { Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger };

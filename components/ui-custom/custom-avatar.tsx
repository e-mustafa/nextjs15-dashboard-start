'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import Image, { ImageProps } from 'next/image';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Avatar Root
function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
	return (
		<AvatarPrimitive.Root
			data-slot='avatar'
			className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
			{...props}
		/>
	);
}

// Avatar Image (using next/image instead of AvatarPrimitive.Image)
function AvatarImage({ className, alt, ...props }: ImageProps & { className?: string }) {
	return (
		<Image
			data-slot='avatar-image'
			alt={alt ?? 'Avatar'}
			className={cn('aspect-square size-full object-cover', className)}
			{...props}
			fill // important to make it fill the parent
		/>
	);
}

// Avatar Fallback
function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot='avatar-fallback'
			className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
			{...props}
		/>
	);
}

export { Avatar, AvatarFallback, AvatarImage };

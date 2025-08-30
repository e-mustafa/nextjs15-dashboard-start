import Image from 'next/image';
import Link from 'next/link';
import { JSX } from 'react';

export default function GlobalLogo({ size = 56 }: { size?: number }): JSX.Element {
	return (
		<Link
			href='/'
			className='text-lg font-bold grid place-items-center overflow-hidden hover:scale-105 starting:scale-0 scale-100 transition-all duration-300'
		>
			<Image src='/assets/images/brand/icon.png' alt='website logo' width={size} height={size} priority />
		</Link>
	);
}

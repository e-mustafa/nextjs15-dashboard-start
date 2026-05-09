import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar-rtl';
import Image from 'next/image';
import Link from 'next/link';

export default function SidebarLogo() {
	const { open } = useSidebar();

	return (
		<SidebarMenuButton size='lg' className='min-h-fit shrink-0 px-2'>
			<Link href='/' data-open={open} className='w-full flex items-center justify-center'>
				{open ? (
					<Image
						src='/assets/images/brand/icon.webp'
						alt='ellm logo'
						className='h-10 starting:scale-0 scale-100 transition-all duration-300 w-auto'
						width={104}
						height={36}
						priority
					/>
				) : (
					<Image
						src='/assets/images/brand/icon.webp'
						alt='ellm logo'
						className='h-10 starting:scale-0 scale-100 transition-all duration-300'
						width={36}
						height={36}
						priority
					/>
				)}
			</Link>
		</SidebarMenuButton>
	);
}

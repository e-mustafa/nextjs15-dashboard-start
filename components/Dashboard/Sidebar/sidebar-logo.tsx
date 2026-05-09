import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar-rtl';
import Image from 'next/image';
import Link from 'next/link';

export default function SidebarLogo() {
	const { open } = useSidebar();

	return (
		<SidebarMenuButton size='sm' className='min-h-fit shrink-0 px-2'>
			<Link href='/' data-open={open} className='w-full flex items-center justify-center'>
				<Image
					src='/assets/images/brand/icon.webp'
					alt='ellm logo'
					className='h-10 starting:scale-0 scale-100 transition-all duration-300 min-w-10'
					width={40}
					height={40}
					priority
				/>
				{open && <h3 className='text-2xl font-semibold text-primary'>Falcon</h3>}
			</Link>
		</SidebarMenuButton>
	);
}

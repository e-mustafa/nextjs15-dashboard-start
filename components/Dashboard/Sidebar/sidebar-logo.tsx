import Image from 'next/image';
import Link from 'next/link';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar-rtl';

export default function SidebarLogo() {
	const { open } = useSidebar();

	console.log('Sidebar ', open);

	return (
		<SidebarMenuButton size='lg' className='min-h-fit shrink-0 px-2'>
			<Link href='/' data-open={open} className='w-full flex items-center justify-center'>
				{open ? (
					<Image
						src='/assets/images/sllm-identity/sllm-logo.svg'
						alt='sllm logo'
						className='h-10 starting:scale-0 scale-100 transition-all duration-300'
						width={104}
						height={36}
					/>
				) : (
					<Image
						src='/assets/images/sllm-identity/icon.svg'
						alt='sllm logo'
						className='h-10 starting:scale-0 scale-100 transition-all duration-300'
						width={36}
						height={36}
					/>
				)}
			</Link>
		</SidebarMenuButton>
	);
}

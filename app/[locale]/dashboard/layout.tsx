// const i18nNamespaces = ['messages'];

import { AppSidebar } from '@/components/Dashboard/Sidebar/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar-rtl';
import { ReactNode } from 'react';

export default async function DashboardLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
	// const { locale } = await params;

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className='bg-sidebar'>
				<header className='bg-sidebar min-h-[72px] flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
					<div className='flex items-center gap-2 py-2 px-4'>
						<SidebarTrigger className='-ms-1 size-10 ' />
						<Separator orientation='vertical' className='me-2 h-4' />
					</div>
				</header>

				<main className='bg-background ms-3 flex flex-1 flex-col gap-4 min-[901px]:rounded-ss-xlxxx p-4 lg:ps-[1.875rem] lg:pe-12 lg:py-6 min-[901px]:rtl:shadow-[2px_-2px_4.3px_0_rgba(0,0,0,0.1)] min-[901px]:ltr:shadow-[-2px_-2px_4.3px_0_rgba(0,0,0,0.1)] basis-full'>
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

'use client';

import { LanguageToggle } from '@/components/languageToggle';
import { ModeToggle } from '@/components/modeToggle';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar-rtl';
import { dir } from 'i18next';
import { data } from './data';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import SidebarLogo from './sidebar-logo';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar
			collapsible='icon'
			side={dir() === 'rtl' ? 'right' : 'left'}
			{...props}
			className='font-medium border-0 bg-sidebar shadow-md shadow-aurora backdrop-blur-md'
		>
			<SidebarHeader className='min-h-[72px]'>
				<SidebarLogo />
			</SidebarHeader>

			<SidebarContent>
				<NavMain items={data.navMain} />
				{/* <NavProjects projects={data.projects} /> */}
				<LanguageToggle />
				<ModeToggle />
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

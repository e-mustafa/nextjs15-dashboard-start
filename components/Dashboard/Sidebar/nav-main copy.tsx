'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from '@/components/ui/sidebar-rtl';
import { LocalesData } from '@/configs/general';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export interface TSidebarItems {
	// title: { ar: string; en: string };
	group_name: Record<LocalesData, string>;
	title: Record<LocalesData, string>;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: TSidebarItems[];
}

export function NavMain({ items, title = '' }: { items: TSidebarItems[]; title: string }) {
	// get locale
	const { i18n } = useTranslation('dashboard');
	const locale = i18n.language as LocalesData;
	// const { t } = useTranslation('dashboard');
	console.log('items', items);

	const { state, isMobile } = useSidebar();

	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item, index) => (
					<>
						{item.group_name && item.group_name[locale] && (
							<SidebarGroupLabel key={item.group_name[locale] + index}>{item.group_name[locale]}</SidebarGroupLabel>
						)}

						{item.items && !item.items.length ? (
							<SidebarMenuButton
								tooltip={item.title[locale]}
								className='rtl:text-start group-data-[state=open]/collapsible:!bg-muted'
							>
								{item.icon && <item.icon className='!size-6' />}
								<span className='grow truncate capitalize'>{item.title[locale]}</span>
							</SidebarMenuButton>
						) : (
							<Collapsible
								key={item.title[locale] + index}
								asChild
								defaultOpen={item.isActive}
								className='group/collapsible mb-4'
							>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton
											tooltip={item.title[locale]}
											className='rtl:text-start group-data-[state=open]/collapsible:!bg-muted'
										>
											{item.icon && <item.icon className='!size-6' />}
											<span className='grow truncate capitalize'>{item.title[locale]}</span>
											{item.items && item.items.length > 0 && (
												<ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
											)}
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent className='overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'>
										<SidebarMenuSub className='rtl:border-r-2 rtl:border-l-0'>
											{item.items?.map((subItem, index) => (
												<SidebarMenuSubItem key={subItem.title[locale]} className='group'>
													<SidebarMenuSubButton asChild className='p-2 h-auto'>
														<Link href={subItem.url} className='flex items-center gap-2 capitalize'>
															<span>
																{subItem.icon && <subItem.icon className='!size-6' />}{' '}
																{subItem.title[locale]}
															</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						)}
					</>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

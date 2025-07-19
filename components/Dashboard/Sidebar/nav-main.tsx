'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface TSidebarItems {
	group_name?: Record<LocalesData, string>;
	title: Record<LocalesData, string>;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: TSidebarItems[];
}

export function NavMain({ items, title = '' }: { items: TSidebarItems[]; title: string }) {
	const { i18n } = useTranslation('dashboard');
	const locale = i18n.language as LocalesData;
	const { state, isMobile } = useSidebar();
	const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item, index) => {
					const hasChildren = item.items && item.items.length > 0;
					const itemKey = item.title[locale] + index;

					return (
						<div key={itemKey} className='relative'>
							{item.group_name && item.group_name[locale] && (
								<SidebarGroupLabel>{item.group_name[locale]}</SidebarGroupLabel>
							)}

							{hasChildren ? (
								state !== 'collapsed' ? (
									<Collapsible asChild defaultOpen={item.isActive} className='group/collapsible mb-4'>
										<SidebarMenuItem>
											<CollapsibleTrigger asChild>
												<SidebarMenuButton
													tooltip={item.title[locale]}
													className='rtl:text-start group-data-[state=open]/collapsible:!bg-muted'
												>
													{item.icon && <item.icon className='!size-6' />}
													<span className='grow truncate capitalize'>{item.title[locale]}</span>
													<ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
												</SidebarMenuButton>
											</CollapsibleTrigger>
											<CollapsibleContent className='overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'>
												<SidebarMenuSub className='rtl:border-r-2 rtl:border-l-0'>
													{item.items?.map((subItem, subIndex) => (
														<SidebarMenuSubItem key={subItem.title[locale] + subIndex} className='group'>
															<SidebarMenuSubButton asChild className='p-2 h-auto'>
																<Link href={subItem.url} className='flex items-center gap-2 capitalize'>
																	{subItem.icon && <subItem.icon className='!size-6' />}
																	{subItem.title[locale]}
																</Link>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													))}
												</SidebarMenuSub>
											</CollapsibleContent>
										</SidebarMenuItem>
									</Collapsible>
								) : (
									<div
										key={itemKey}
										className='relative group'
										onMouseEnter={() => setOpenPopoverIndex(index)}
										onMouseLeave={() => setOpenPopoverIndex(null)}
									>
										<Popover open={openPopoverIndex === index}>
											<PopoverTrigger asChild>
												<SidebarMenuButton
													tooltip={state !== 'collapsed' ? item.title[locale] : ''}
													className='rtl:text-start p-0'
												>
													{item.icon && <item.icon className='!size-5' />}
													<span className='grow truncate capitalize'>{item.title[locale]}</span>
												</SidebarMenuButton>
											</PopoverTrigger>
											<PopoverContent
												side='right'
												align='start'
												className='min-w-36 w-max z-40 rtl:left-auto rtl:right-full p-2 ms-5'
											>
												<SidebarMenuSub className='rtl:border-r-2 rtl:border-l-0 m-0 p-0'>
													{!!item.group_name && (
														<span className='text-muted-foreground text-center text-xs'>
															{item.group_name?.[locale]}
														</span>
													)}
													{item.items?.map((subItem, subIndex) => (
														<SidebarMenuSubItem key={subItem.title[locale] + subIndex} className='group'>
															<SidebarMenuSubButton asChild className='p-2 h-auto'>
																<Link href={subItem.url} className='flex items-center gap-2 capitalize'>
																	{subItem.icon && <subItem.icon className='!size-6' />}
																	{subItem.title[locale]}
																</Link>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													))}
												</SidebarMenuSub>
											</PopoverContent>
										</Popover>
									</div>
								)
							) : (
								<SidebarMenuButton tooltip={item.title[locale]} className='rtl:text-start'>
									{item.icon && <item.icon className='!size-6' />}
									<span className='grow truncate capitalize'>{item.title[locale]}</span>
								</SidebarMenuButton>
							)}
						</div>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}

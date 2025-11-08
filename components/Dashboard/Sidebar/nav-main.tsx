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
import { TLocalesData } from '@/configs/general';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface TSidebarItems {
	group_name?: Record<TLocalesData, string>;
	title: Record<TLocalesData, string>;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: TSidebarItems[];
}

export function NavMain({ items }: { items: TSidebarItems[] }) {
	const { i18n } = useTranslation('dashboard');
	const locale = i18n.language as TLocalesData;
	const { state } = useSidebar();
	const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

	return (
		<SidebarGroup className='p-1'>
			<SidebarMenu className='gap-3 ps-1'>
				{items.map((item, index) => {
					const hasChildren = item.items && item.items.length > 0;
					const itemKey = item.title[locale] + index;

					return (
						<div key={itemKey} className='relative text-sidebar-primary'>
							{item.group_name && item.group_name[locale] && state !== 'collapsed' && (
								<SidebarGroupLabel>{item.group_name[locale]}</SidebarGroupLabel>
							)}

							{hasChildren ? (
								state !== 'collapsed' ? (
									<Collapsible asChild defaultOpen={item.isActive} className='group/collapsible '>
										<SidebarMenuItem>
											<CollapsibleTrigger asChild>
												<SidebarMenuButton
													size='lg'
													tooltip={item.title[locale]}
													className='rtl:text-start group-data-[state=open]/collapsible:bg-muted!'
												>
													{item.icon && <item.icon className='size-6!' />}
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
																	{subItem.icon && <subItem.icon className='size-full!' />}
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
											<PopoverTrigger asChild className=''>
												<SidebarMenuButton
													size='lg'
													tooltip={state !== 'collapsed' ? item.title[locale] : ''}
													className={cn(
														'rtl:text-start p-1!',
														openPopoverIndex === index && ' bg-sidebar-accent text-sidebar-foreground'
													)}
												>
													{item.icon && <item.icon className='size-full!' />}
													{state !== 'collapsed' && (
														<span className='grow truncate capitalize'>{item.title[locale]}</span>
													)}
												</SidebarMenuButton>
											</PopoverTrigger>
											<PopoverContent
												side='right'
												align='start'
												className='min-w-36 w-max z-40 rtl:left-auto rtl:right-full p-2'
											>
												<SidebarMenuSub className='m-0 p-0 border-0'>
													{!!item.group_name && (
														<span className='text-muted-foreground text-center text-xs'>
															{item.group_name?.[locale]}
														</span>
													)}
													{item.items?.map((subItem, subIndex) => (
														<SidebarMenuSubItem key={subItem.title[locale] + subIndex} className='group'>
															<SidebarMenuSubButton asChild className='p-2 h-auto'>
																<Link href={subItem.url} className='flex items-center gap-2 capitalize'>
																	{subItem.icon && <subItem.icon className='size-full!' />}
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
								<SidebarMenuButton size='lg' tooltip={item.title[locale]} className='rtl:text-start'>
									{item.icon && <item.icon className={cn(state == 'collapsed' ? 'size-8!' : 'size-6!')} />}
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

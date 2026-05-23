'use client';

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
import useLocale from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export interface TSidebarItems {
	group_name?: string;
	// group_name?: Record<TLocalesData, string>;
	// title: Record<TLocalesData, string>;
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: TSidebarItems[];
}

export function NavMain({ items }: { items: TSidebarItems[] }) {
	const { t, locale } = useLocale();
	const { state } = useSidebar();
	const pathname = usePathname().replace(new RegExp(`^/${locale}`), '');
	const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

	const isItemActive = (item: TSidebarItems): boolean => {
		const hasChildren = item.items && item.items.length > 0;

		if (item.url && item.url !== '#') {
			// full match for elements without children
			if (!hasChildren) return pathname === item.url;
			// partial match for elements with children => startsWith
			return pathname.startsWith(item.url);
		}

		if (item.items) return item.items.some((sub) => sub.url && pathname === sub.url);
		return false;
	};

	const isSubItemActive = (url: string): boolean => {
		return pathname.startsWith(url);
	};

	return (
		<SidebarGroup className='p-1'>
			<SidebarMenu className='gap-3 ps-1'>
				{items.map((item, index) => {
					const hasChildren = item.items && item.items.length > 0;
					const itemKey = item.title + index;
					const active = isItemActive(item);

					return (
						<div key={itemKey} className='relative text-sidebar-primary'>
							{item.group_name && state !== 'collapsed' && (
								<SidebarGroupLabel>{t(item.group_name)}</SidebarGroupLabel>
							)}

							{hasChildren ? (
								state !== 'collapsed' ? (
									<Collapsible
										asChild
										defaultOpen={active} // 👈 un collapse if some it's chid is active
										className='group/collapsible'
									>
										<SidebarMenuItem>
											<CollapsibleTrigger asChild>
												<SidebarMenuButton
													size='lg'
													tooltip={t(item.title)}
													isActive={active}
													className='rtl:text-start group-data-[state=open]/collapsible:bg-muted!'
												>
													{item.icon && <item.icon className='size-6!' />}
													<span className='grow truncate capitalize'>{t(item.title)}</span>
													<ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
												</SidebarMenuButton>
											</CollapsibleTrigger>
											<CollapsibleContent className='overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'>
												<SidebarMenuSub className='rtl:border-r-2 rtl:border-l-0'>
													{item.items?.map((subItem, subIndex) => (
														<SidebarMenuSubItem key={subItem.title + subIndex} className='group'>
															<SidebarMenuSubButton
																asChild
																className='p-2 h-auto data-[active=true]:bg-sidebar-primary/20'
																isActive={isSubItemActive(subItem.url)}
															>
																<Link href={subItem.url} className='flex items-center gap-2 capitalize'>
																	{subItem.icon && <subItem.icon className='size-full!' />}
																	{t(subItem.title)}
																</Link>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													))}
												</SidebarMenuSub>
											</CollapsibleContent>
										</SidebarMenuItem>
									</Collapsible>
								) : (
									// Popover (collapsed state)
									<div
										className='relative group'
										onMouseEnter={() => setOpenPopoverIndex(index)}
										onMouseLeave={() => setOpenPopoverIndex(null)}
									>
										<Popover open={openPopoverIndex === index}>
											<PopoverTrigger asChild>
												<SidebarMenuButton
													size='lg'
													isActive={active}
													className={cn(
														'rtl:text-start p-1!',
														openPopoverIndex === index && 'bg-sidebar-accent text-sidebar-foreground',
													)}
												>
													{item.icon && <item.icon className='size-full!' />}
												</SidebarMenuButton>
											</PopoverTrigger>
											<PopoverContent
												side='right'
												align='start'
												className='min-w-36 w-max z-40 rtl:left-auto rtl:right-full p-2'
											>
												<SidebarMenuSub className='m-0 p-0 border-0'>
													{!!item.group_name && (
														<span className='text-muted-foreground text-center text-xs mb-2'>
															{t(item.group_name)}
														</span>
													)}
													{item.items?.map((subItem, subIndex) => (
														<SidebarMenuSubItem key={subItem.title + subIndex} className='group'>
															<SidebarMenuSubButton
																asChild
																className='p-2 h-auto hover:bg-sidebar-primary/10 data-[active=true]:bg-sidebar-primary/20'
																isActive={isSubItemActive(subItem.url)} // 👈
															>
																<Link href={subItem.url} className='flex items-center gap-2 capitalize'>
																	{subItem.icon && <subItem.icon className='size-full!' />}
																	{t(subItem.title)}
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
									// No children
								<SidebarMenuButton
									size='lg'
									tooltip={t(item.title)}
									isActive={pathname === item.url}
									className='rtl:text-start data-[active=true]:bg-sidebar-primary/20'
								>
									{item.icon && <item.icon className={cn(state === 'collapsed' ? 'size-8!' : 'size-6!')} />}
									<Link href={item.url} className='grow truncate capitalize'>
										{t(item.title)}
									</Link>
								</SidebarMenuButton>
							)}
						</div>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}

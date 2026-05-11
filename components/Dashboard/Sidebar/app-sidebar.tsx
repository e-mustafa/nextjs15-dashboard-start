'use client';

import {
	AudioWaveform,
	BookOpen,
	Bot,
	Command,
	Frame,
	GalleryVerticalEnd,
	Map,
	PieChart,
	Settings2,
	SquareTerminal,
	Users2Icon,
} from 'lucide-react';

import { dir } from 'i18next';

// import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { LanguageToggle } from '@/components/languageToggle';
import { ModeToggle } from '@/components/modeToggle';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar-rtl';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import SidebarLogo from './sidebar-logo';

// const t = useTranslation('dashboard');

// This is sample data.
const data = {
	user: {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: 'https://picsum.photos/100/100?random=1',
	},
	teams: [
		{
			name: 'Acme Inc',
			logo: GalleryVerticalEnd,
			plan: 'Enterprise',
		},
		{
			name: 'Acme Corp.',
			logo: AudioWaveform,
			plan: 'Startup',
		},
		{
			name: 'Evil Corp.',
			logo: Command,
			plan: 'Free',
		},
	],
	navMain: [
		{
			title: { ar: 'الرئيسية', en: 'main' },
			url: '/dashboard',
			icon: SquareTerminal,
			isActive: true,
			items: [],
		},

		{
			group_name: { ar: 'المبيعات', en: 'sales' },
			title: { ar: 'الطلبات', en: 'orders' },
			url: '#',
			icon: Bot,
			items: [
				{
					title: { ar: 'الطلبات', en: 'orders' },
					url: '/dashboard/orders',
				},
				{
					title: { ar: 'السلات المتروكة', en: 'abandoned carts' },
					url: '/dashboard/abandoned-carts',
				},
			],
		},
		{
			group_name: { ar: 'أدارة المنتجات', en: 'products management' },
			title: { ar: 'المنتجات', en: 'products' },
			url: '#',
			icon: BookOpen,
			items: [
				{
					title: { ar: 'المنتجات', en: 'products' },
					url: '/dashboard/products',
				},
				{
					title: { ar: 'الخصومات', en: 'discounts' },
					url: '/dashboard/discounts',
				},
				{
					title: { ar: 'الكوبونات', en: 'coupons' },
					url: '/dashboard/coupons',
				},
				{
					title: { ar: 'المجموعات', en: 'collections' },
					url: '/dashboard/collections',
				},
				{
					title: { ar: 'التصنيفات', en: 'categories' },
					url: '/dashboard/categories',
				},

				{
					title: { ar: 'الماركات', en: 'brands' },
					url: '/dashboard/brands',
				},
			],
		},
		{
			title: { ar: 'العملاء', en: 'customers' },
			icon: Users2Icon,
			url: '/dashboard/customers',
		},
		{
			group_name: { ar: 'ادارة المخزون', en: 'inventory management' },
			title: { ar: 'المخزون', en: 'inventory' },
			url: '#',
			icon: Frame,
			items: [
				{
					title: { ar: 'المستودعات', en: 'warehouses' },
					url: '/dashboard/warehouses',
				},
				{
					title: { ar: 'الموردين', en: 'vendors' },
					url: '/dashboard/vendors',
				},
			],
		},
		{
			title: { ar: 'التقارير', en: 'reports' },
			url: '#',
			icon: PieChart,
			items: [
				{
					title: { ar: 'الطلبات', en: 'orders' },
					url: '/dashboard/reports/orders',
				},
				{
					title: { ar: 'المنتجات', en: 'products' },
					url: '/dashboard/reports/products',
				},
				{
					title: { ar: 'العملاء', en: 'customers' },
					url: '/dashboard/reports/customers',
				},
			],
		},
		{
			title: { ar: 'التسويق', en: 'marketing' },
			url: '#',
			icon: GalleryVerticalEnd,
			items: [
				{
					title: { ar: 'الرسائل الإخبارية', en: 'newsletters' },
					url: '/dashboard/newsletters',
				},
				{
					title: { ar: 'المدونة', en: 'blog' },
					url: '/dashboard/blog',
				},
			],
		},

		{
			group_name: { ar: 'ادارة المتجر', en: 'store management' },

			title: { ar: 'المتجر', en: 'store' },
			url: '#',
			icon: GalleryVerticalEnd,
			items: [
				{
					title: { en: 'brand identity', ar: 'ادارة العلامة التجارية' },
					url: '/dashboard/store/terms_pages',
				},
				{
					title: { ar: 'الصفحات التعريفية', en: 'terms pages' },
					url: '/dashboard/store/terms_pages',
				},
				{
					title: { ar: 'المدونة', en: 'blog' },
					url: '/dashboard/blog',
				},
			],
		},

		{
			title: { ar: 'الاعدادات', en: 'settings' },
			url: '#',
			icon: Settings2,
			items: [
				{
					title: { ar: 'الاعدادات العامة', en: 'General' },
					url: '#',
				},
				{
					title: { ar: 'المدفوعات', en: 'Payments' },
					url: '#',
				},
				{
					title: { ar: 'الشحن', en: 'Shipping' },
					url: '#',
				},
				{
					title: { ar: 'المتجر', en: 'store' },
					url: '#',
				},
			],
		},
	],

	projects: [
		{
			name: 'Design Engineering',
			url: '#',
			icon: Frame,
		},
		{
			name: 'Sales & Marketing',
			url: '#',
			icon: PieChart,
		},
		{
			name: 'Travel',
			url: '#',
			icon: Map,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible='icon' side={dir() === 'rtl' ? 'right' : 'left'} {...props} className='font-medium border-0 bg-sidebar shadow-md shadow-aurora backdrop-blur-md'>
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

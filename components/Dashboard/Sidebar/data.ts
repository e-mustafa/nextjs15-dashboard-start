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

// This is sidebar data.
export const data = {
	user: {
		name: 'Falcon',
		email: 'm@example.com',
		avatar: '/assets/images/brand/icon.webp',
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
			title: 'sidebar.nav.main',
			url: '/dashboard',
			icon: SquareTerminal,
			isActive: true,
			items: [],
		},
		{
			group_name: 'sidebar.nav.sales_group',
			title: 'sidebar.nav.orders',
			url: '#',
			icon: Bot,
			items: [
				{
					title: 'sidebar.nav.orders',
					url: '/dashboard/orders',
				},
				{
					title: 'sidebar.nav.abandoned_carts',
					url: '/dashboard/abandoned-carts',
				},
			],
		},
		{
			group_name: 'sidebar.nav.products_group',
			title: 'sidebar.nav.products',
			url: '#',
			icon: BookOpen,
			items: [
				{
					title: 'sidebar.nav.products',
					url: '/dashboard/products',
				},
				{
					title: 'sidebar.nav.discounts',
					url: '/dashboard/discounts',
				},
				{
					title: 'sidebar.nav.coupons',
					url: '/dashboard/coupons',
				},
				{
					title: 'sidebar.nav.collections',
					url: '/dashboard/collections',
				},
				{
					title: 'sidebar.nav.categories',
					url: '/dashboard/categories',
				},
				{
					title: 'sidebar.nav.brands',
					url: '/dashboard/brands',
				},
			],
		},
		{
			title: 'sidebar.nav.customers',
			icon: Users2Icon,
			url: '/dashboard/customers',
		},
		{
			group_name: 'sidebar.nav.inventory_group',
			title: 'sidebar.nav.inventory',
			url: '#',
			icon: Frame,
			items: [
				{
					title: 'sidebar.nav.warehouses',
					url: '/dashboard/warehouses',
				},
				{
					title: 'sidebar.nav.vendors',
					url: '/dashboard/vendors',
				},
			],
		},
		{
			title: 'sidebar.nav.reports',
			url: '#',
			icon: PieChart,
			items: [
				{
					title: 'sidebar.nav.orders',
					url: '/dashboard/reports/orders',
				},
				{
					title: 'sidebar.nav.products',
					url: '/dashboard/reports/products',
				},
				{
					title: 'sidebar.nav.customers',
					url: '/dashboard/reports/customers',
				},
			],
		},
		{
			title: 'sidebar.nav.marketing',
			url: '#',
			icon: GalleryVerticalEnd,
			items: [
				{
					title: 'sidebar.nav.newsletters',
					url: '/dashboard/newsletters',
				},
				{
					title: 'sidebar.nav.blog',
					url: '/dashboard/blog',
				},
			],
		},
		{
			group_name: 'sidebar.nav.store_management_group',
			title: 'sidebar.nav.store',
			url: '#',
			icon: GalleryVerticalEnd,
			items: [
				{
					title: 'sidebar.nav.brand_identity',
					url: '/dashboard/store/brand-identity',
				},
				{
					title: 'sidebar.nav.terms_pages',
					url: '/dashboard/store/terms_pages',
				},
				{
					title: 'sidebar.nav.blog',
					url: '/dashboard/blog',
				},
			],
		},
		{
			title: 'sidebar.nav.settings',
			url: '#',
			icon: Settings2,
			items: [
				{
					title: 'sidebar.nav.general_settings',
					url: '/dashboard/settings/general',
				},
				{
					title: 'sidebar.nav.payments',
					url: '/dashboard/settings/payments',
				},
				{
					title: 'sidebar.nav.shipping',
					url: '/dashboard/settings/shipping',
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

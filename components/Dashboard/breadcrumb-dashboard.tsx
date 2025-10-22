// src/components/BreadcrumbDashboard.tsx
'use client';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import i18nConfig from '@/i18n.Config';
import { HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

export default function BreadcrumbDashboard({ lastPath }: { lastPath?: string }) {
	const pathname = usePathname();
	const { t, i18n } = useTranslation();
	const segments = pathname
		.split('/')
		.filter(Boolean)
		.filter((s) => !i18nConfig.locales?.includes(s));

	const paths = segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/'));

	return (
		<Breadcrumb dir={i18n.dir()}>
			<BreadcrumbList>
				{segments.map((segment, index) => {
					const isLast = index === segments.length - 1;
					const path = paths[index];
					const label = t(`breadcrumbs.${segment}`, segment);

					return !isLast ? (
						<Fragment key={path}>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link href={path} className='flex items-center gap-1 hover:underline'>
										{index === 0 && <HomeIcon className='size-4 ' />}
										<span className='capitalize'>{label}</span>
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='rtl:rotate-180' />
						</Fragment>
					) : (
						<BreadcrumbPage key={path}>{lastPath || label}</BreadcrumbPage>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

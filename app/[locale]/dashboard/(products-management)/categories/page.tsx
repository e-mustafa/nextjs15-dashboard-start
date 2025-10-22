// import DataTableComponent from '@/components/Dashboard/dataTable/data-table';
// import { BrandDataTable } from '@/components/Dashboard/brands-table-data';
import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import LoaderTableSkeleton from '@/components/shard/loaders/loader-table-skeleton';
import { Button } from '@/components/ui-custom/custom-button';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { Brand } from '@/server/services/brand-service';
import { FilePlusIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

const CategoryDataTable = dynamic(() => import('@/components/Dashboard/categories-table-data'), {
	// ssr: false,
});

export const url_segment = 'dashboard/categories';
const i18nNamespaces = ['dashboard'];

export default async function CategoryPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const result = await getDataInPage<Brand>({ url_segment, locale, tags: ['categories'] });

	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard />
			<div className='stack-component flex-wrap'>
				<h1>
					{t('common.sections.list')} {t('common.sections.categories')}
				</h1>

				<Button asChild className='ms-auto'>
					<Link href='/dashboard/categories/create'>
						<FilePlusIcon />
						{t('common.sections.create_category')}
					</Link>
				</Button>
			</div>
			<div className='stack-component'>
				<Suspense
					fallback={
						<div className='min-h-[calc(100vh/2)] w-full relative'>
							<LoaderTableSkeleton />
						</div>
					}
				>
					<CategoryDataTable result={result} locale={locale} />
				</Suspense>
			</div>
		</div>
	);
}

import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionGeneral from '@/components/Dashboard/shard/head-section-general-page';
import LoaderTableSkeleton from '@/components/shard/loaders/loader-table-skeleton';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { Category } from '@/server/services/category-service';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { dash_url, i18nNamespaces } from '../../layout';

const CategoryDataTable = dynamic(() => import('@/components/Dashboard/dataTable-sections/categories-dataTable'), {
	// ssr: false,
});

export const url_segment = `${dash_url}/categories`;
export const tags = ['categories'];

export default async function CategoryPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const result = await getDataInPage<Category>({ url_segment, locale, tags });

	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard />
			<HeadSectionGeneral
				title={t('common.sections.list_section', { name: t('common.sections.categories') })}
				link={`${url_segment}/create`}
				btnTitle={t('common.sections.create_category')}
			/>

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

import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionGeneral from '@/components/Dashboard/Shared/head-section-general-page';
import LoaderTableSkeleton from '@/components/Shared/loaders/loader-table-skeleton';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { Collection } from '@/server/services/collection-service';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { dash_url, i18nNamespaces } from '../../layout';

const CollectionDataTable = dynamic(() => import('@/components/Dashboard/dataTable-sections/collections-dataTable'), {
	// ssr: false,
});

export const url_segment = `${dash_url}/collections`;
export const tags = ['collections'];

export default async function CollectionsPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const result = await getDataInPage<Collection>({ url_segment, locale, tags });

	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard />

			<HeadSectionGeneral
				title={t('common.sections.list_section', { name: t('common.sections.collections') })}
				link={`${url_segment}/create`}
				btnTitle={t('common.sections.create_collection')}
			/>

			<div className='stack-component'>
				<Suspense
					fallback={
						<div className='min-h-[calc(100vh/2)] w-full relative'>
							<LoaderTableSkeleton />
						</div>
					}
				>
					<CollectionDataTable result={result} locale={locale} />
				</Suspense>
			</div>
		</div>
	);
}

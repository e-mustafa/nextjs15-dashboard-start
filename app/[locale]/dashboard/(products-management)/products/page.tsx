import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import LoaderTableSkeleton from '@/components/shard/loaders/loader-table-skeleton';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { Product } from '@prisma/client';
// import { Product } from '@/server/services/product-service';
import HeadSectionGeneral from '@/components/Dashboard/shard/head-section-general-page';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { dash_url, i18nNamespaces } from '../../layout';

const ProductsDataTable = dynamic(() => import('@/components/Dashboard/dataTable-sections/products-dataTable'), {
	// ssr: false,
});

export const url_segment = `${dash_url}/products`;
export const tags = ['products'];

export default async function ProductsPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const result = await getDataInPage<Product>({ url_segment, locale, tags });

	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard />

			<HeadSectionGeneral
				title={t('common.sections.list_section', { name: t('common.sections.products') })}
				link={`${url_segment}/create`}
				btnTitle={t('common.sections.create_product')}
			/>

			<div className='stack-component'>
				<Suspense
					fallback={
						<div className='min-h-[calc(100vh/2)] w-full relative'>
							<LoaderTableSkeleton />
						</div>
					}
				>
					<ProductsDataTable result={result} locale={locale} />
				</Suspense>
			</div>
		</div>
	);
}

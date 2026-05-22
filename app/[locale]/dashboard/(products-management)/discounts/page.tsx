import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionGeneral from '@/components/Dashboard/shard/head-section-general-page';
import LoaderTableSkeleton from '@/components/shard/loaders/loader-table-skeleton';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { FormattedDiscount } from '@/server/services/discount-service';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { dash_url, i18nNamespaces } from '../../layout';

const DiscountDataTable = dynamic(() => import('@/components/Dashboard/dataTable-sections/discounts-dataTable'), {
	// ssr: false,
});

export const url_segment = `${dash_url}/discounts`;
export const tags = ['discounts', 'products'];

export default async function DiscountsPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const result = await getDataInPage<FormattedDiscount>({ url_segment, locale, tags });

	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard />

			<HeadSectionGeneral
				title={t('common.sections.list_section', { name: t('common.sections.discounts') })}
				link={`${url_segment}/create`}
				btnTitle={t('common.sections.create_discount')}
			/>

			<div className='stack-component'>
				<Suspense
					fallback={
						<div className='min-h-[calc(100vh/2)] w-full relative'>
							<LoaderTableSkeleton />
						</div>
					}
				>
					<DiscountDataTable result={result} locale={locale} />
				</Suspense>
			</div>
		</div>
	);
}

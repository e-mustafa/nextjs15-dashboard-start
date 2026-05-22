import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionGeneral from '@/components/Dashboard/shard/head-section-general-page';
import LoaderTableSkeleton from '@/components/shard/loaders/loader-table-skeleton';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { FormattedCoupon } from '@/server/services/coupon-service';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { dash_url, i18nNamespaces } from '../../layout';

const CouponDataTable = dynamic(() => import('@/components/Dashboard/dataTable-sections/coupons-dataTable'), {
	// ssr: false,
});

export const url_segment = `${dash_url}/coupons`;
export const tags = ['coupons', 'products'];

export default async function CouponsPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const result = await getDataInPage<FormattedCoupon>({ url_segment, locale, tags });

	// console.log('result-- brand', result);

	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard />

			<HeadSectionGeneral
				title={t('common.sections.list_section', { name: t('common.sections.coupons') })}
				link={`${url_segment}/create`}
				btnTitle={t('common.sections.create_coupon')}
			/>

			<div className='stack-component'>
				<Suspense
					fallback={
						<div className='min-h-[calc(100vh/2)] w-full relative'>
							<LoaderTableSkeleton />
						</div>
					}
				>
					<CouponDataTable result={result} locale={locale} />
				</Suspense>
			</div>
		</div>
	);
}

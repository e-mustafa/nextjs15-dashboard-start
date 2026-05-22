import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionCreate from '@/components/Dashboard/Shared/head-section-create-page';
import LoaderBlock from '@/components/Shared/loaders/loader-block';
import { TLocalesData } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { TCouponFormValues } from '@/validation/coupon-validation';
import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { i18nNamespaces } from '../../../layout';
import { tags, url_segment } from '../page';

const CouponForm = dynamic(() => import('@/components/Dashboard/forms/coupon-form'), {
	// ssr: false,
});

export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function UpdateCouponsPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const result = await getDataInPage<TCouponFormValues>({ url_segment, id, locale, tags });

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.edit_coupon')} />

			<HeadSectionCreate
				link={url_segment}
				title={t('common.sections.edit_coupon')}
				name={(result.data as TCouponFormValues)?.[`name_${locale}`] || ''}
			/>

			<Suspense fallback={<LoaderBlock />}>
				<CouponForm type={EnumFormTypes.UPDATE} response={result} />
			</Suspense>
		</div>
	);
}

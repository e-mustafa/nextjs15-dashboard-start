import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionCreate from '@/components/Dashboard/shard/head-section-create-page';
import LoaderBlock from '@/components/shard/loaders/loader-block';
import { TLocalesData } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { TBrandFormValues } from '@/validation/brand-validation';
import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { i18nNamespaces } from '../../../layout';
import { url_segment } from '../page';

const BrandForm = dynamic(() => import('@/components/Dashboard/forms/brand-form'), {
	// ssr: false,
});

export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function UpdateBrandsPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const result = await getDataInPage<TBrandFormValues>({ url_segment, id, locale, tags: ['brands'] });

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.edit_brand')} />

			<HeadSectionCreate
				link={url_segment}
				title={t('common.sections.edit_brand')}
				name={(result.data as TBrandFormValues)?.[`name_${locale}`] || ''}
			/>

			<Suspense fallback={<LoaderBlock />}>
				<BrandForm type={EnumFormTypes.UPDATE} response={result} />
			</Suspense>
		</div>
	);
}

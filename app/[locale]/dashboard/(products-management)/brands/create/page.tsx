import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionCreate from '@/components/Dashboard/Shared/head-section-create-page';
import LoaderBlock from '@/components/Shared/loaders/loader-block';
import { EnumFormTypes } from '@/constant/enums-development';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { i18nNamespaces } from '../../../layout';
import { url_segment } from '../page';

const BrandForm = dynamic(() => import('@/components/Dashboard/forms/brand-form'), {
	// ssr: false,
});

export default async function CreateBrandPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.create_brand')} />
			<HeadSectionCreate link={url_segment} title={t('common.sections.create_brand')} />

			<Suspense fallback={<LoaderBlock />}>
				<BrandForm type={EnumFormTypes.CREATE} />
			</Suspense>
		</div>
	);
}

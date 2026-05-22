import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionCreate from '@/components/Dashboard/Shared/head-section-create-page';
import LoaderFormSkeleton from '@/components/Shared/loaders/loader-form-skeleton';
import { EnumFormTypes } from '@/constant/enums-development';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { i18nNamespaces } from '../../../layout';
import { url_segment } from '../page';

const CategoryForm = dynamic(() => import('@/components/Dashboard/forms/category-form'), {
	// ssr: false,
});

export default async function CreateCategoryPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.create_category')} />
			<HeadSectionCreate link={url_segment} title={t('common.sections.create_category')} />

			<Suspense fallback={<LoaderFormSkeleton />}>
				<CategoryForm type={EnumFormTypes.CREATE} />
			</Suspense>
		</div>
	);
}

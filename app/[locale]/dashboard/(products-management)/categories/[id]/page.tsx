import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionCreate from '@/components/Dashboard/Shared/head-section-create-page';
import LoaderBlock from '@/components/Shared/loaders/loader-block';
import { TLocalesData } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { TCategoryFormValues } from '@/validation/category-validation';
import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { i18nNamespaces } from '../../../layout';
import { url_segment } from '../page';

const CategoryForm = dynamic(() => import('@/components/Dashboard/forms/category-form'), {
	// ssr: false,
});

export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function UpdateCategoryPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const result = await getDataInPage<TCategoryFormValues>({ url_segment, id, locale, tags: ['categories'] });
	console.log('result', result);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.edit_category')} />

			<HeadSectionCreate
				link={url_segment}
				title={t('common.sections.edit_category')}
				name={(result.data as TCategoryFormValues)?.[`name_${locale}`] || ''}
			/>

			<Suspense fallback={<LoaderBlock />}>
				<CategoryForm type={EnumFormTypes.UPDATE} response={result} />
			</Suspense>
		</div>
	);
}

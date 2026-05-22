import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionCreate from '@/components/Dashboard/Shared/head-section-create-page';
import LoaderBlock from '@/components/Shared/loaders/loader-block';
import { TLocalesData } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { TProductFormValues } from '@/validation/product-validation';
import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { i18nNamespaces } from '../../../layout';
import { url_segment } from '../page';

const ProductForm = dynamic(() => import('@/components/Dashboard/forms/product-form'), {
	// ssr: false,
});

export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function UpdateProductsPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const result = await getDataInPage<TProductFormValues>({ url_segment, id, locale, tags: ['products'] });

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.edit_product')} />

			<HeadSectionCreate
				link={url_segment}
				title={t('common.sections.edit_product')}
				name={(result.data as TProductFormValues)?.[`name_${locale}`] || ''}
			/>

			<Suspense fallback={<LoaderBlock />}>
				<ProductForm type={EnumFormTypes.UPDATE} response={result} />
			</Suspense>
		</div>
	);
}

import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import HeadSectionCreate from '@/components/Dashboard/Shared/head-section-create-page';
import LoaderBlock from '@/components/Shared/loaders/loader-block';
import { TLocalesData } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { TCollectionFormValues } from '@/validation/collection-validation';
import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { i18nNamespaces } from '../../../layout';
import { url_segment } from '../page';

const CollectionForm = dynamic(() => import('@/components/Dashboard/forms/collection-form'), {
	// ssr: false,
});

export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function UpdateCollectionsPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const result = await getDataInPage<TCollectionFormValues>({ url_segment, id, locale, tags: ['collections'] });

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.edit_collection')} />

			<HeadSectionCreate
				link={url_segment}
				title={t('common.sections.edit_collection')}
				name={(result.data as TCollectionFormValues)?.[`name_${locale}`] || ''}
			/>

			<Suspense fallback={<LoaderBlock />}>
				<CollectionForm type={EnumFormTypes.UPDATE} response={result} />
			</Suspense>
		</div>
	);
}

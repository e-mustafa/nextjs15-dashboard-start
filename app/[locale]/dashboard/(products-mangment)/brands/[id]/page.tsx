// import DataTableComponent from '@/components/Dashboard/dataTable/data-table';
// import BrandForm from '@/components/Dashboard/forms/brand-form';
import initTranslations from '@/app/i18n';
import { TBrandFormValues } from '@/components/Dashboard/forms/brand-form';
import LoaderBlock from '@/components/shard/loaders/loader-block';
import { Button } from '@/components/ui-custom/custom-button';
import { TLocalesData } from '@/configs/general';
import { getDataInPage } from '@/lib/server/api.server';
import { ArrowRightIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ReactNode, Suspense } from 'react';

const BrandForm = dynamic(() => import('@/components/Dashboard/forms/brand-form'), {
	// ssr: false,
	// loading: () => <LoaderBlock />,
});

const i18nNamespaces = ['dashboard'];
export const url_segment = 'dashboard/brands';
export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function EditBrandsPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const brand = await getDataInPage<TBrandFormValues>({
		url_segment,
		id,
		locale,
		tags: ['brand'],
	});

	// if (!brand.success && brand.error) {
	// 	return redirectWithToast('error', brand.error || t('api.errors.not_found'), `/${url_segment}`);
	// }

	// if (!brand.success && brand.error) {
	// 	router.push(`/${url_segment}?toast_error=${brand.error}`);
	// }

	return (
		<div className='page-component flex-col'>
			<div className='flex gap-2 items-center'>
				<Button asChild variant='ghost' size='icon'>
					<Link href={`/${url_segment}`}>
						<ArrowRightIcon className='size-6 text-muted-foreground' />
					</Link>
				</Button>
				{t('common.sections.edit_brand') + ' : '}
				<span className='capitalize font-semibold'>{brand.data?.[`name_${locale}`]}</span>
			</div>

			<Suspense fallback={<LoaderBlock />}>
				<BrandForm type='update' response={brand} />
			</Suspense>
		</div>
	);
}

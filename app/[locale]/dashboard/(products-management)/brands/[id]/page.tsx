
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import { TBrandFormValues } from '@/components/Dashboard/forms/brand-form';
import LoaderBlock from '@/components/shard/loaders/loader-block';
import { Button } from '@/components/ui-custom/custom-button';
import { TLocalesData } from '@/configs/general';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { ArrowRightIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ReactNode, Suspense } from 'react';
import { url_segment } from '../page';

const BrandForm = dynamic(() => import('@/components/Dashboard/forms/brand-form'), {
	// ssr: false,
});

const i18nNamespaces = ['dashboard'];
export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function EditBrandsPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const result = await getDataInPage<TBrandFormValues>({ url_segment, id, locale, tags: ['brands'] });

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastBath={t('breadcrumbs.edit_brand')} />
			<div className='flex gap-2 items-center'>
				<Button asChild variant='ghost' size='icon'>
					<Link href={`/${url_segment}`}>
						<ArrowRightIcon className='size-6 text-muted-foreground' />
					</Link>
				</Button>
				{t('common.sections.edit_brand') + ' : '}
				<span className='capitalize font-semibold'>{(result.data as TBrandFormValues)?.[`name_${locale}`]}</span>
			</div>

			<Suspense fallback={<LoaderBlock />}>
				<BrandForm type='update' response={result} />
			</Suspense>
		</div>
	);
}

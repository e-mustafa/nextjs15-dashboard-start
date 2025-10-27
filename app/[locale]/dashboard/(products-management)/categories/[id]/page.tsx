import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import LoaderBlock from '@/components/shard/loaders/loader-block';
import { Button } from '@/components/ui-custom/custom-button';
import { TLocalesData } from '@/configs/general';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { TCategoryFormValues } from '@/validation/category-validation';
import { ArrowRightIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ReactNode, Suspense } from 'react';
import { url_segment } from '../page';

const CategoryForm = dynamic(() => import('@/components/Dashboard/forms/category-form'), {
	// ssr: false,
});

const i18nNamespaces = ['dashboard'];
export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function EditCategoryPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const result = await getDataInPage<TCategoryFormValues>({ url_segment, id, locale, tags: ['categories'] });
	console.log('result', result);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.edit_category')} />
			<div className='flex gap-2 items-center'>
				<Button asChild variant='ghost' size='icon'>
					<Link href={`/${url_segment}`}>
						<ArrowRightIcon className='size-6 text-muted-foreground' />
					</Link>
				</Button>
				{t('common.sections.edit_category') + ' : '}
				<span className='capitalize font-semibold'>{(result.data as TCategoryFormValues)?.[`name_${locale}`]}</span>
			</div>

			<Suspense fallback={<LoaderBlock />}>
				<CategoryForm type='update' response={result} />
			</Suspense>
		</div>
	);
}

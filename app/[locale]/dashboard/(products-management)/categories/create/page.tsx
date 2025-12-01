import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import LoaderFormSkeleton from '@/components/shard/loaders/loader-form-skeleton';
import { Button } from '@/components/ui-custom/custom-button';
import { EnumFormTypes } from '@/constant/enums-development';
import { ArrowRightIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { url_segment } from '../page';

const CategoryForm = dynamic(() => import('@/components/Dashboard/forms/category-form'), {
	// ssr: false,
});

const i18nNamespaces = ['dashboard'];

export default async function CreateCategoryPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.create_category')} />
			<div className='flex gap-2 items-center'>
				<Button asChild variant='ghost' size='icon'>
					<Link href={`/${url_segment}`}>
						<ArrowRightIcon className='size-6 text-muted-foreground' />
					</Link>
				</Button>
				{t('common.sections.create_category')}
			</div>

			<Suspense fallback={<LoaderFormSkeleton />}>
				<CategoryForm type={EnumFormTypes.CREATE} />
			</Suspense>
		</div>
	);
}

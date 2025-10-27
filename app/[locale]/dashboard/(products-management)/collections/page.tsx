import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import LoaderTableSkeleton from '@/components/shard/loaders/loader-table-skeleton';
import { Button } from '@/components/ui-custom/custom-button';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { Collection } from '@/server/services/collection-service';
import { FilePlusIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

const CollectionDataTable = dynamic(() => import('@/components/Dashboard/dataTable-sections/collections-dataTable'), {
	// ssr: false,
});

export const url_segment = 'dashboard/collections';
const i18nNamespaces = ['dashboard'];

export default async function CollectionsPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const result = await getDataInPage<Collection>({ url_segment, locale, tags: ['collections'] });

	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard />
			<div className='stack-component flex-wrap'>
				<h1>
					{t('common.sections.list')} {t('common.sections.collections')}
				</h1>

				<Button asChild className='ms-auto'>
					<Link href='/dashboard/collections/create'>
						<FilePlusIcon />
						{t('common.sections.create_collection')}
					</Link>
				</Button>
			</div>
			<div className='stack-component'>
				<Suspense
					fallback={
						<div className='min-h-[calc(100vh/2)] w-full relative'>
							<LoaderTableSkeleton />
						</div>
					}
				>
					<CollectionDataTable result={result} locale={locale} />
				</Suspense>
			</div>
		</div>
	);
}

import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import LoaderTableSkeleton from '@/components/shard/loaders/loader-table-skeleton';
import { Button } from '@/components/ui-custom/custom-button';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { Product } from '@prisma/client';
// import { Product } from '@/server/services/product-service';
import { FilePlusIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

const ProductsDataTable = dynamic(() => import('@/components/Dashboard/dataTable-sections/products-dataTable'), {
	// ssr: false,
});

export const url_segment = 'dashboard/products';
const i18nNamespaces = ['dashboard'];

export default async function ProductsPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const result = await getDataInPage<Product>({ url_segment, locale, tags: ['products'] });

	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard />
			<div className='stack-component flex-wrap'>
				<h1>
					{t('common.sections.list')} {t('common.sections.products')}
				</h1>

				<Button asChild className='ms-auto'>
					<Link href={`/${url_segment}/create`}>
						<FilePlusIcon />
						{t('common.sections.create_product')}
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
					<ProductsDataTable result={result} locale={locale} />
				</Suspense>
			</div>
		</div>
	);
}

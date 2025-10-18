import { TLayoutProps } from '@/app/[locale]/layout';
import initTranslations from '@/app/i18n';
import LoaderBlock from '@/components/shard/loaders/loader-block';
import { Button } from '@/components/ui-custom/custom-button';
import { ArrowRightIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

const BrandForm = dynamic(() => import('@/components/Dashboard/forms/brand-form'), {
	// ssr: false,
});

const i18nNamespaces = ['dashboard'];

export default async function AddBrandPage({ params }: TLayoutProps) {
	const { locale } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	return (
		<div className='page-component flex-col'>
			<div className='flex gap-2 items-center'>
				<Button asChild variant='ghost' size='icon'>
					<Link href='/dashboard/brands'>
						<ArrowRightIcon className='size-6 text-muted-foreground' />
					</Link>
				</Button>
				{t('common.sections.add_brand')}
			</div>

			<Suspense fallback={<LoaderBlock />}>
				<BrandForm type='create' />
			</Suspense>
		</div>
	);
}

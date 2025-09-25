// import DataTableComponent from '@/components/Dashboard/dataTable/data-table';
import BrandForm from '@/components/Dashboard/forms/brand-form';
import { Button } from '@/components/ui-custom/custom-button';
import { ArrowRightIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

const DataTableComponent = dynamic(() => import('@/components/Dashboard/dataTable/data-table'), {
	// ssr: false,
});

export default async function BrandsPage() {
	// const headersList = await headers();
	// const locale = headersList.get('x-url') || headersList.get('NEXT_LOCALE') || defaultLocale.short;
	// console.log('localessss: ', locale);

	return (
		<div className='page-component flex-col'>
			<div className='flex gap-2 items-center'>
				<Button asChild variant='ghost' size='icon'>
					<Link href='/dashboard/brands'>
						<ArrowRightIcon className='size-6 text-muted-foreground' />
					</Link>
				</Button>
				Add Brand 
			</div>

			<Suspense fallback={<div>Loading...</div>}>
				<BrandForm />
			</Suspense>
		</div>
	);
}

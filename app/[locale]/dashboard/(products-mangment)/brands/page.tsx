// import DataTableComponent from '@/components/Dashboard/dataTable/data-table';
import { Button } from '@/components/ui-custom/custom-button';
import { FilePlusIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DataTableComponent = dynamic(() => import('@/components/Dashboard/dataTable/data-table'), {
	// ssr: false,
});

export default function BrandsPage() {
	return (
		<div className='flex flex-col gap-6'>
			Brands Page (Table)
			<div className='stack-component'>
				<h1>Brands</h1>
				
				<Button>
					Add Brand <FilePlusIcon />
				</Button>
			</div>
			<div className='stack-component'>
				<Suspense fallback={<div>Loading...</div>}>
					<DataTableComponent />
				</Suspense>
			</div>
		</div>
	);
}

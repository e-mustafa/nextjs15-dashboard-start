// import DataTableComponent from '@/components/Dashboard/dataTable/data-table';
import { Button } from '@/components/ui-custom/custom-button';
import { FilePlusIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

const DataTableComponent = dynamic(() => import('@/components/Dashboard/dataTable/data-table'), {
	// ssr: false,
});

export default function BrandsPage() {
	return (
		<div className='page-component flex-col'>
			Brands Page (Table)
			<div className='stack-component'>
				<h1>Brands</h1>

				<Button asChild>
					<Link href='/dashboard/brands/add-brand'>
						Add Brand <FilePlusIcon />
					</Link>
				</Button>
			</div>
			<div className='stack-component'>
				<Suspense fallback={<div>Loading...</div>}>
					<DataTableComponent />

					{/* <DataTableComponent
						key={filteredData.length}
						columns={columns}
						mobileDefaultColumns={mobileColumns}
						data={filteredData}
						queryText={queryText}
						setQueryText={setQueryText}
						searchInData={searchInData}
						isSearching={isSearching}
					/> */}
				</Suspense>
			</div>
		</div>
	);
}

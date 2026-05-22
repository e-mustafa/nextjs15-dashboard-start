import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LoaderTableSkeleton() {
	return (
		<div className='rounded-lg z-10 absolute inset-0 size-full bg-black'>
			<Table className='w-full'>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Skeleton className='h-5 w-[100px]' />
						</TableHead>
						<TableHead>
							<Skeleton className='h-5 w-[100px]' />
						</TableHead>
						<TableHead>
							<Skeleton className='h-5 w-[100px]' />
						</TableHead>
						<TableHead>
							<Skeleton className='h-5 w-[100px]' />
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{[...Array(10)].map((_, i) => (
						<TableRow key={i}>
							<TableCell>
								<Skeleton className='h-5 w-[100px]' />
							</TableCell>
							<TableCell>
								<Skeleton className='h-5 w-[100px]' />
							</TableCell>
							<TableCell>
								<Skeleton className='h-5 w-[100px]' />
							</TableCell>
							<TableCell>
								<Skeleton className='h-5 w-[100px]' />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

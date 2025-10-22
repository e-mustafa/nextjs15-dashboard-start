import { Skeleton } from '@/components/ui/skeleton';

export default function LoaderFormSkeleton() {
	return (
		<div className='rounded-lg size-full bg-black/50 p-3 grid gap-6'>
			<Skeleton className='h-4 w-2/5 md:w-1/5' />

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={index} className='flex flex-col gap-2'>
						<Skeleton className='h-4 w-1/4' />
						<Skeleton className='h-8 w-full' />
					</div>
				))}

				<div className='flex flex-col gap-2 md:col-span-2'>
					<Skeleton className='h-4 w-1/4' />
					<Skeleton className='h-32 w-full' />
				</div>
			</div>
		</div>
	);
}

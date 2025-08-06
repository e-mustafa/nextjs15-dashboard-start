import { prisma_DB } from '@/server/db/prisma';

export default async function DashboardPage() {
	const products = await prisma_DB.product.findMany();
	console.log('Products:', products);
	return (
		// <SidebarInset className='bg-sidebar'>
		// 	<header className='bg-sidebar min-h-[72px] flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
		// 		<div className='flex items-center gap-2 p-4'>
		// 			<SidebarTrigger className='-ms-1' />
		// 			<Separator orientation='vertical' className='me-2 h-4' />
		// 		</div>
		//    </header>

		// 	<main className='bg-background ms-3 flex flex-1 flex-col gap-4 min-[901px]:rounded-ss-xl p-4 lg:ps-[1.875rem] lg:pe-12 lg:py-6 min-[901px]:rtl:shadow-[2px_-2px_4.3px_0_rgba(0,0,0,0.1)] min-[901px]:ltr:shadow-[-2px_-2px_4.3px_0_rgba(0,0,0,0.1)] basis-full'>
		// 		<BreadcrumbDashboard />

		// 		<div className='grid auto-rows-min gap-4 md:grid-cols-3'>
		// 			<div className='aspect-video rounded-xl bg-muted/50' />
		// 			<div className='aspect-video rounded-xl bg-muted/50' />
		// 			<div className='aspect-video rounded-xl bg-muted/50' />
		// 		</div>
		// 		<div className='min-h-[100dvh] flex-1 rounded-xl bg-muted/50 md:min-h-min' />
		// 	</main>
		// </SidebarInset>
		<div>dashboard main page</div>
	);
}

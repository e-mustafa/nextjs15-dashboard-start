import initTranslations from '@/app/i18n';
import { AppSidebar } from '@/components/Dashboard/Sidebar/app-sidebar';
import GlobalProgressBar from '@/components/shard/loaders/global-progress-bar';
import { ScrollArea } from '@/components/ui-custom/custom-scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar-rtl';
import TranslationsProvider from '@/contexts/translations-provider';
import { TLayoutProps } from '../layout';

const i18nNamespaces = ['dashboard'];

export default async function DashboardLayout({ children, params }: TLayoutProps) {
	const { locale } = await params;

	const { resources, dir } = await initTranslations(i18nNamespaces, locale);

	return (
		<TranslationsProvider namespaces={i18nNamespaces} locale={locale} resources={resources}>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className='bg-transparent overflow-hidden'>
					<header className='sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl min-h-[72px] flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
						<div className='flex items-center gap-2 py-2 px-4'>
							<SidebarTrigger className='-ms-1 size-10 ' />
							<Separator orientation='vertical' className='me-2 h-4' />
						</div>
						{/* <Progress value={75} className='self-end rounded-none w-[calc(100%-186px)] h-1' /> */}
						<GlobalProgressBar />
					</header>

					{/* <main className='bg-background rounded-t-2xl sm:ms-3 py-4 px-1 sm:px-4 flex flex-1 flex-col gap-4 min-[901px]:rounded-ss-xlxxx p-4 lg:ps-[1.875rem] lg:pe-12 lg:py-6 min-[901px]:rtl:shadow-[2px_-2px_4.3px_0_rgba(0,0,0,0.1)] min-[901px]:ltr:shadow-[-2px_-2px_4.3px_0_rgba(0,0,0,0.1)] basis-full'></main> */}

					<main className='rounded-t-2xlxxx sm:ms-3 flex flex-1 flex-col gap-4 shadow-lg basis-full'>
						<ScrollArea
							dir={dir}
							className='max-h-[calc(100dvh-72px)] overflow-y-auto py-4xxx px-1 sm:px-4 p-4xxx md:px-6'
						>
							{children}
						</ScrollArea>
						{/* {children} */}
					</main>
				</SidebarInset>
			</SidebarProvider>
		</TranslationsProvider>
	);
}

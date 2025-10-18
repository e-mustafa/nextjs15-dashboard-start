import initTranslations from '@/app/i18n';
import { AppSidebar } from '@/components/Dashboard/Sidebar/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar-rtl';
import TranslationsProvider from '@/contexts/translations-provider';
import { TLayoutProps } from '../layout';

const i18nNamespaces = ['dashboard'];

export default async function DashboardLayout({ children, params }: TLayoutProps) {
	const { locale } = await params;

	const { resources } = await initTranslations(i18nNamespaces, locale);

	return (
		<TranslationsProvider namespaces={i18nNamespaces} locale={locale} resources={resources}>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset className='bg-sidebar overflow-hidden'>
					<header className='bg-sidebar min-h-[72px] flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
						<div className='flex items-center gap-2 py-2 px-4'>
							<SidebarTrigger className='-ms-1 size-10 ' />
							<Separator orientation='vertical' className='me-2 h-4' />
						</div>
					</header>

					{/* <main className='bg-background rounded-t-2xl sm:ms-3 py-4 px-1 sm:px-4 flex flex-1 flex-col gap-4 min-[901px]:rounded-ss-xlxxx p-4 lg:ps-[1.875rem] lg:pe-12 lg:py-6 min-[901px]:rtl:shadow-[2px_-2px_4.3px_0_rgba(0,0,0,0.1)] min-[901px]:ltr:shadow-[-2px_-2px_4.3px_0_rgba(0,0,0,0.1)] basis-full'></main> */}

					<main className='bg-background rounded-t-2xlxxx sm:ms-3 py-4 px-1 sm:px-4 flex flex-1 flex-col gap-4 p-4 md:p-6 shadow-lg basis-full'>
						{children}
					</main>
				</SidebarInset>
			</SidebarProvider>
		</TranslationsProvider>
	);
}

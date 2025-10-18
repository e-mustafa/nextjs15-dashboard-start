import initTranslations from '@/app/i18n';
import GlobalLogo from '@/components/globalLogo';
import TranslationsProvider from '@/contexts/translations-provider';
import { TLayoutProps } from '../layout';

const i18nNamespaces = ['auth'];

export default async function AuthLayout({ children, params }: TLayoutProps) {
	const { locale } = await params;
	const { resources } = await initTranslations(i18nNamespaces, locale);

	// get users from database
	// const users = await prisma_DB.user.findMany();
	// console.log('users111', users);

	return (
		<TranslationsProvider locale={locale} namespaces={i18nNamespaces} resources={resources}>
			<div className='h-screen flex items-center justify-center gradient-blue'>
				<div className='w-full h-full grid lg:grid-cols-2 p-4'>
					<div className='max-w-sm w-full place-self-center h-fit flex flex-col  items-center border rounded-lg p-6 shadow-2xl shadow-primary/10 mx-auto bg-muted'>
						<div className='grid place-items-center size-28 rounded-full bg-muted -mt-20 border-t'>
							<GlobalLogo size={80} />
						</div>

						{children}
					</div>
					<div className='bg-muted hidden lg:block rounded-lg' />
				</div>
			</div>
		</TranslationsProvider>
	);
}

import Link from 'next/link';
import initTranslations from './i18n';
import TranslationsProvider from '@/components/TranslationsProvider';
import { headers } from 'next/headers';
import { defaultLocale } from '@/configs/general';

const i18nNamespaces = ['general'];
export default async function NotFoundPage({ params }: { params: { locale: string } }) {
	// const header = await headers();
	// const locale = header.get('NEXT_LOCALE') || defaultLocale.short;

	const headersList = await headers();
	const locale = headersList.get('x-locale') || headersList.get('NEXT_LOCALE') || defaultLocale.short;

	console.log('locale', locale);
	// const { locale } = await params;
	const { t, resources } = await initTranslations(locale, i18nNamespaces);
	

	return (
		<TranslationsProvider namespaces={i18nNamespaces} locale={locale} resources={resources}>
			<div className='min-h-screen flex flex-col items-center justify-center text-center px-4'>
				<h1 className='text-4xl font-bold mb-4'>{t('error_pages.NotFound.title')}</h1>
				<p className='text-lg mb-6'>{t('error_pages.NotFound.description')}</p>
				<Link href='/' className='text-blue-600 hover:underline transition-colors'>
					{t('error_pages.NotFound.backToHome')}
				</Link>
			</div>
		</TranslationsProvider>
	);
}

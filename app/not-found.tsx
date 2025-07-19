import Link from 'next/link';
import initTranslations from './i18n';
import TranslationsProvider from '@/components/TranslationsProvider';

const i18nNamespaces = ['error-pages'];
export default async function NotFoundPage({ params }: { params: { locale: string } }) {
	const { locale } = await params;
   const { t, resources } = await initTranslations(locale, i18nNamespaces);
      console.log('resources', resources);

	return (
		<TranslationsProvider namespaces={i18nNamespaces} locale={locale} resources={resources}>
			<div className='min-h-screen flex flex-col items-center justify-center text-center px-4'>
				<h1 className='text-4xl font-bold mb-4'>{t('NotFound.title')}</h1>
				<p className='text-lg mb-6'>{t('NotFound.description')}</p>
				<Link href='/' className='text-blue-600 hover:underline transition-colors'>
					{t('NotFound.backToHome')}
				</Link>
			</div>
		</TranslationsProvider>
	);
}

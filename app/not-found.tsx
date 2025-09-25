import { ThemeProvider } from '@/components/theme-provider';
import TranslationsProvider from '@/components/TranslationsProvider';
import { TLocalesData } from '@/configs/general';
import Link from 'next/link';
import './globals.css';
import initTranslations from './i18n';

const i18nNamespaces = ['general'];
export default async function NotFoundPage() {
	const { t, locale, resources } = await initTranslations(i18nNamespaces);

	return (
		<TranslationsProvider namespaces={i18nNamespaces} locale={locale as TLocalesData} resources={resources}>
			<ThemeProvider attribute='class' defaultTheme='system' enableSystem>
				<div className='min-h-screen flex flex-col items-center justify-center text-center px-4'>
					<h1 className='text-4xl font-bold mb-4'>{t('error_pages.NotFound.title')}</h1>
					<p className='text-lg mb-6'>{t('error_pages.NotFound.description')}</p>
					<Link href='/' className='text-blue-600 hover:underline transition-colors'>
						{t('error_pages.NotFound.backToHome')}
					</Link>
				</div>
			</ThemeProvider>
		</TranslationsProvider>
	);
}

import ExampleClientComponent from '@/components/ExampleClientComponent';
import { LanguageToggle } from '@/components/languageToggle';
import { ModeToggle } from '@/components/modeToggle';
import { TLocalesData } from '@/configs/general';
import Link from 'next/link';
import initTranslations from '../../i18n';
import { TLayoutProps } from '../layout';

const i18nNamespaces = ['general'];

export default async function Home({ params }: TLayoutProps) {
	const { locale } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale as TLocalesData);

	return (
		<main>
			<h1>{t('welcome_message')}</h1>
			<ExampleClientComponent />
			<LanguageToggle />
			<ModeToggle />

			<div className='flex flex-col items-center justify-center'>
				<p className='text-lg font-bold mb-4'>landing page</p>
				<Link href={`/dashboard`} className='text-blue-500 hover:underline'>
					Go to the dashboard
				</Link>
			</div>
		</main>
	);
}

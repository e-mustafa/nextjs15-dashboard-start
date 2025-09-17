import initTranslations from '../i18n';
import ExampleClientComponent from '@/components/ExampleClientComponent';
import { LanguageToggle } from '@/components/languageToggle';
import { ModeToggle } from '@/components/modeToggle';
import Link from 'next/link';

const i18nNamespaces = ['general'];

type Props = {
	params: {
		locale: string;
	};
};
export default async function Home({ params }: Props) {
	const { locale } = await params;
	const { t, resources } = await initTranslations(locale, i18nNamespaces);

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

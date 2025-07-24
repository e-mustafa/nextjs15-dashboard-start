import initTranslations from '@/app/i18n';
import TranslationsProvider from '@/components/TranslationsProvider';
import { Button } from '@/components/ui-custom/custom-button';
import { Separator } from '@/components/ui/separator';
import { FigmaIcon, GithubIcon, InstagramIcon, TwitchIcon, TwitterIcon } from 'lucide-react';
import { ReactNode } from 'react';

const i18nNamespaces = ['auth'];
export default async function AuthLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
	const { locale } = await params;
	const { t, resources } = await initTranslations(locale, i18nNamespaces);
	return (
		<TranslationsProvider locale={locale} namespaces={i18nNamespaces} resources={resources}>
			<div className='h-screen flex items-center justify-center gradient-blue'>
				<div className='w-full h-full grid lg:grid-cols-2 p-4'>
					<div className='max-w-sm w-full place-self-center h-fit flex flex-col gap-5 items-center border rounded-lg p-6 shadow-2xl shadow-primary/10 mx-auto bg-muted'>
						<p className='text-xl font-bold tracking-tight'>Sign up for Shadcn UI Blocks</p>
						<p className='text-sm text-muted-foreground '>Enter your email and password to create an account.</p>
						<div className='flex items-center gap-3'>
							<Button variant='outline' size='icon' className='rounded-full size-10'>
								<GithubIcon className='!size-5' />
							</Button>
							<Button variant='outline' size='icon' className='rounded-full size-10'>
								<InstagramIcon className='!size-5' />
							</Button>
							<Button variant='outline' size='icon' className='rounded-full size-10'>
								<TwitterIcon className='!size-5' />
							</Button>
							<Button variant='outline' size='icon' className='rounded-full size-10'>
								<FigmaIcon className='!size-5' />
							</Button>
							<Button variant='outline' size='icon' className='rounded-full size-10'>
								<TwitchIcon className='!size-5' />
							</Button>
						</div>

						<div className='w-full flex items-center justify-center overflow-hidden'>
							<Separator />
							<span className='text-sm px-2'>OR</span>
							<Separator />
						</div>

						{children}
					</div>
					<div className='bg-muted hidden lg:block rounded-lg' />
				</div>
			</div>
		</TranslationsProvider>
	);
}

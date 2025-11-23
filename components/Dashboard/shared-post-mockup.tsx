import { Card, CardContent } from '@/components/ui/card';
import { config_env, defaultLocale, localesData } from '@/configs/general';
import { SEODataKey } from '@/configs/SEOData';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';

export type ShardPostMockupCardProps = {
	ar: {
		title?: string;
		description?: string;
		slug?: string;
	};
	en: {
		title?: string;
		description?: string;
		slug?: string;
	};
};

export default function ShardPostMockupCard({ data, image }: { data?: ShardPostMockupCardProps; image?: string }) {
	const {
		t,
		i18n: { language },
	} = useTranslation();

	const infos = data && data[language as SEODataKey];
	const oLang = (Object.keys(localesData)?.find((lng) => lng !== language) || defaultLocale.short) as SEODataKey;

	return (
		<div className='w-full h-full grid xl:place-content-center space-y-4 bg-background bg-accent/20xxx p-2 rounded-2xl'>
			{/* Result Card */}
			<div className='p-2 lg:p-3 bg-accent/20 rounded-2xl max-w-80xxx max-w-[90%]'>
				<Card className='bg-background/50 gap-3 text-white border-0 p-0 shadow-md rounded-2xl overflow-hidden'>
					<CardContent className='flex flex-col lg:flex-row px-0 overflow-hidden'>
						<Image
							src={image || '/assets/images/brand/icon.png'}
							alt='website preview'
							width={300}
							height={100}
							priority
							className='w-full h-auto aspect-auto object-contain lg:w-[25%] lg:aspect-squarexxx lg:object-cover'
						/>

						<div className='flex flex-col gap-3 md:gap-2 p-3 justify-between flex-1'>
							<h5 className='text-sm font-medium line-clamp-2 lg:line-clamp-1'>
								{infos?.title || data?.[oLang]?.title || t('forms.labels.seo_title')}
							</h5>
							{infos?.description || data?.[oLang]?.description ? (
								<p className='text-xs text-foreground line-clamp-3 lg:line-clamp-1 xl:line-clamp-2xxx'>
									{infos?.description || data?.[oLang]?.description}
								</p>
							) : (
								<div className='space-y-1'>
									<Skeleton className='h-4 w-full bg-muted-foreground' />
									<Skeleton className='h-4 w-3/4 bg-muted-foreground lg:hidden xl:blockxxx' />
									<Skeleton className='h-4 w-1/2 bg-muted-foreground lg:hidden' />
								</div>
							)}

							<div dir='ltr' className='flex gap-3 items-center justify-between'>
								<a href='#' className='text-sm text-foreground hover:underline'>
									{config_env.domain || 'www.example.com'}
								</a>

								<Image src='/assets/images/brand/icon.png' alt='website logo' width={32} height={32} priority />
							</div>
						</div>
					</CardContent>
				</Card>
				<a href='#' className='flex text-sm text-blue-400 font-medium hover:underline pt-2'>
					{`${config_env.domain || 'www.example.com'}/.../${infos?.slug || data?.[oLang]?.slug || ''}`}
				</a>
			</div>
		</div>
	);
}

import { Card, CardContent } from '@/components/ui/card';
import { config_env } from '@/configs/general';
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
	console.log('image', image);

	return (
		<div className='w-full h-full grid place-content-center space-y-4 bg-background bg-accent/20xxx p-2 rounded-2xl'>
			{/* Result Card */}
			<div className='p-2 lg:p-3 bg-accent/20 rounded-2xl max-w-80xxx max-w-[80%]'>
				<Card className='bg-background/50 gap-3 text-white border-0 p-0 shadow-md rounded-2xl overflow-hidden'>
					<CardContent className='flex flex-col lg:flex-row px-0 overflow-hidden'>
						<Image
							src={image || '/assets/images/brand/icon.png'}
							alt='website preview'
							width={300}
							height={100}
							priority
							className='w-full h-auto aspect-auto object-contain lg:w-1/3 lg:aspect-square lg:object-cover'
						/>

						<div className='flex flex-col gap-3 p-3 justify-between'>
							<h5 className='font-medium line-clamp-2 lg:line-clamp-1'>
								{infos?.title || t('forms.labels.seo_title')}
							</h5>
							{infos?.description ? (
								<p className='text-sm text-foreground line-clamp-3 lg:line-clamp-1 xl:line-clamp-2'>{infos?.description}</p>
							) : (
								<div className='space-y-1'>
									<Skeleton className='h-4 w-full bg-muted-foreground' />
									<Skeleton className='h-4 w-3/4 bg-muted-foreground' />
									<Skeleton className='h-4 w-1/2 bg-muted-foreground' />
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
					{`${config_env.domain || 'www.example.com'}/.../${infos?.slug || ''}`}
				</a>
			</div>
		</div>
	);
}

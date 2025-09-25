import { Card, CardContent } from '@/components/ui/card';
import { seoData, SEODataKey } from '@/configs/SEOData';
import { SearchIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';

export interface SEOMockupCardData {
	ar: {
		title?: string;
		description?: string;
		link?: string;
	};
	en: {
		title?: string;
		description?: string;
		link?: string;
	};
}

export default function SEOMockupCard({ data }: { data?: SEOMockupCardData }) {
	const { i18n:{ language } } = useTranslation();

	const infos = data && data[language as SEODataKey];

	return (
		<div className='w-full mx-auto space-y-4 bg-zinc-900 p-4 rounded-2xl'>
			{/* Search bar */}
			<div className='relative flex items-center gap-2 bg-background/50 rounded-2xl px-4 py-2 shadow-md'>
				<SearchIcon className='w-5 h-5 text-zinc-400' />
				<Skeleton className='h-4 w-full bg-zinc-700' />
				<span className='text-white font-bold text-lg'>
					<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
						<path
							fillRule='evenodd'
							clipRule='evenodd'
							d='M20.0004 10.2271C20.0004 9.518 19.9368 8.83619 19.8186 8.18164H10.4004V12.0498H15.7822C15.5504 13.2998 14.8458 14.3589 13.7868 15.068V17.5771H17.0186C18.9095 15.8362 20.0004 13.2725 20.0004 10.2271Z'
							fill='#4285F4'
						></path>
						<path
							fillRule='evenodd'
							clipRule='evenodd'
							d='M10.4012 20.0004C13.1012 20.0004 15.3648 19.1049 17.0194 17.5777L13.7876 15.0686C12.8921 15.6686 11.7467 16.0231 10.4012 16.0231C7.79666 16.0231 5.59212 14.264 4.80575 11.9004H1.46484V14.4913C3.1103 17.7595 6.49212 20.0004 10.4012 20.0004Z'
							fill='#34A853'
						></path>
						<path
							fillRule='evenodd'
							clipRule='evenodd'
							d='M4.80494 11.8997C4.60494 11.2997 4.4913 10.6588 4.4913 9.9997C4.4913 9.34061 4.60494 8.6997 4.80494 8.0997V5.50879H1.46403C0.786754 6.85879 0.400391 8.38606 0.400391 9.9997C0.400391 11.6133 0.786754 13.1406 1.46403 14.4906L4.80494 11.8997Z'
							fill='#FBBC05'
						></path>
						<path
							fillRule='evenodd'
							clipRule='evenodd'
							d='M10.4012 3.97727C11.8694 3.97727 13.1876 4.48182 14.2239 5.47273L17.0921 2.60455C15.3603 0.990909 13.0967 0 10.4012 0C6.49212 0 3.1103 2.24091 1.46484 5.50909L4.80575 8.1C5.59212 5.73636 7.79666 3.97727 10.4012 3.97727Z'
							fill='#EA4335'
						></path>
					</svg>
				</span>
			</div>

			{/* Result Card */}
			<Card className='bg-background/50 text-white border-0 p-4 shadow-md rounded-2xl'>
				<CardContent className='space-y-2 px-0'>
					<div className='flex items-center gap-2 mb-4'>
						<Image src='/assets/images/brand/icon.png' alt='website logo' width={46} height={46} priority />
						<div className='grid gap-1.5'>
							<p className='text-sm text-zinc-300'>{seoData[language as SEODataKey]?.title}</p>
							<a href='#' className='text-sm text-zinc-400 hover:underline'>
								{infos?.link || 'www.example.com'}
							</a>
						</div>
					</div>
					<h2 className='text-blue-400 font-medium hover:underline cursor-pointer'>{infos?.title || 'عنوان SEO'}</h2>
					{infos?.description ? (
						<p className='text-sm text-zinc-300'>{infos?.description}</p>
					) : (
						<div className='space-y-1'>
							<Skeleton className='h-4 w-full bg-zinc-700' />
							<Skeleton className='h-4 w-3/4 bg-zinc-700' />
							<Skeleton className='h-4 w-1/2 bg-zinc-700' />
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

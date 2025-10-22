'use client';
import { Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LoaderInstElement() {
	const { t } = useTranslation();

	return (
		<div className='z-20 absolute inset-0 size-full rounded-xl flex gap-2 items-center justify-center bg-muted/80 text-primary'>
			<div className='fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col gap-2'>
				<Loader2Icon className='size-8 animate-spin mx-auto' />
				{t('common.messages.loading')}
			</div>
		</div>
	);
}

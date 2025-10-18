'use client';
import { Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LoaderInstElement() {
	const { t } = useTranslation();

	return (
		<div className='z-[1] absolute inset-0 size-full rounded-xl flex gap-2 items-center justify-center bg-muted/80 text-primary'>
			<Loader2Icon className='size-8 animate-spin' />
			{t('common.messages.loading')}
		</div>
	);
}

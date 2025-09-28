import { Button } from '@/components/ui-custom/custom-button';
import { getBackLink } from '@/lib/utils';
import { Loader2Icon, SaveIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useTranslation } from 'react-i18next';

export default function SubmitButton({ backLink }: { backLink?: string }) {
	const pathname = usePathname();
	const { pending } = useFormStatus();
	const { t } = useTranslation();

	backLink = backLink || getBackLink(pathname);
	console.log('backLink', backLink);
	console.log('pending', pending);

	return (
		<div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
			<Button type='submit' disabled={pending} size='lg' className='min-w-full sm:min-w-32'>
				{pending ? (
					<>
						<Loader2Icon className='size-5 animate-spin' />
						<span className='grow text-center'>{t('common.messages.saving')}</span>
					</>
				) : (
					<>
						<SaveIcon className='size-5' />
						<span className='grow text-center'>{t('common.actions.save')}</span>
					</>
				)}
			</Button>

			{/* cancel button  */}
			<Button type='reset' asChild disabled={pending} variant='outline' size='lg' className='w-full sm:w-32 min-w-fit'>
				<Link href={backLink}>
					<span className='grow text-center'>{t('common.actions.cancel')}</span>
				</Link>
			</Button>
		</div>
	);
}

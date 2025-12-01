import { Button } from '@/components/ui-custom/custom-button';
import { getBackLink } from '@/lib/utils';
import { Loader2Icon, SaveIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function SubmitButton({
	isPending,
	backLink,
	formId,
	resetForm,
}: {
	isPending?: boolean;
	backLink?: string;
	formId?: string;
	resetForm?: () => void;
}) {
	const pathname = usePathname();
	const { t } = useTranslation();

	backLink = backLink || getBackLink(pathname);

	return (
		<div className='flex-1 flex flex-col sm:flex-row items-center sm:justify-end gap-4'>
			<Button type='submit' form={formId} disabled={isPending} size='lg' className='min-w-full sm:min-w-32'>
				{isPending ? (
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

			{resetForm ? (
				<div className='w-full sm:w-auto flex gap-4 items-center *:flex-1'>
					<Button type='reset' variant='outline' onClick={resetForm}>
						{t('common.actions.reset_form')}
					</Button>

					<Button
						type='reset'
						asChild
						disabled={isPending}
						variant='outline'
						size='lg'
						className='w-auto sm:w-32 min-w-fit'
					>
						<Link href={backLink}>
							<span className='grow text-center'>{t('common.actions.cancel')}</span>
						</Link>
					</Button>
				</div>
			) : (
				<Button
					type='reset'
					asChild
					disabled={isPending}
					variant='outline'
					size='lg'
					className='w-auto sm:w-32 min-w-fit'
				>
					<Link href={backLink}>
						<span className='grow text-center'>{t('common.actions.cancel')}</span>
					</Link>
				</Button>
			)}
		</div>
	);
}

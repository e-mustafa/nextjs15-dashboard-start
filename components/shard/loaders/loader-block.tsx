import initTranslations from '@/app/i18n';
import { Loader2Icon } from 'lucide-react';

const i18nNamespaces = ['general'];
export default async function LoaderBlock() {
	const { t } = await initTranslations(i18nNamespaces);

	return (
		<div className='min-h-32 w-full rounded-xl bg-muted/50 flex flex-col items-center justify-center'>
			<Loader2Icon className='size-20 animate-spin text-accent' />
			<span>{t('common.messages.loading')}</span>
		</div>
	);
}

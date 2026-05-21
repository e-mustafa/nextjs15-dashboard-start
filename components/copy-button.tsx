import { CheckCheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui-custom/custom-button';
import TooltipElement from './ui-custom/tooltip-element';

export default function CopyButton({ data }: { data: string }) {
	const { t } = useTranslation();
	const [state, setState] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(data);
		setState(true);
		setTimeout(() => {
			setState(false);
		}, 3000);
	};

	return (
		<TooltipElement content={t('common.actions.copy_to_clipboard')}>
			<Button variant='outline' type='button' size='icon' onClick={copy}>
				{state ? (
					<CheckCheckIcon className='text-green-500 animate-in zoom-in-75' />
				) : (
					<CopyIcon className='animate-in zoom-in-75' />
				)}
			</Button>
		</TooltipElement>
	);
}

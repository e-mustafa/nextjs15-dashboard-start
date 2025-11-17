import { TFunction } from 'i18next';
import { InfoIcon } from 'lucide-react';
import { ElementType, ReactNode } from 'react';
import { Button } from '../ui-custom/custom-button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type Props = {
	Icon: ElementType | undefined;
	info: string | ReactNode;
	t: TFunction;
};

export default function InfoIconTooltip({ Icon = InfoIcon, info, t }: Props) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant='ghost' size='icon' className='scale-75xxx size-7 text-muted-foreground'>
					<Icon className='size-5' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className='text-xs p-2 mx-2 bg-accent whitespace-pre-line'>
				{typeof info === 'string' ? t(info) : info}
			</PopoverContent>
		</Popover>
	);
}

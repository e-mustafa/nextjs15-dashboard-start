import { TFunction } from 'i18next';
import { InfoIcon } from 'lucide-react';
import { ElementType, ReactNode } from 'react';
import { Button } from '../ui-custom/custom-button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type Props = {
	Icon: ElementType | undefined;
	info: string | ReactNode;
	t: TFunction;
};

export default function InfoIconTooltip({ Icon = InfoIcon, info, t }: Props) {
	return (
		// <TooltipProvider>
		// 	<Tooltip>
		// 		<TooltipTrigger asChild>
		// 			<Icon className='size-4 text-muted-foreground' />
		// 		</TooltipTrigger>
		// 		<TooltipContent>{typeof info === 'string' ? t(info) : info}</TooltipContent>
		// 	</Tooltip>
		// </TooltipProvider>

		<Popover>
			<PopoverTrigger asChild>
				<Button variant='ghost' size='icon' className='scale-75xxx size-7 text-muted-foreground' >
					<Icon className='size-5' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className='text-xs p-2 mx-2 bg-accent'>{typeof info === 'string' ? t(info) : info}</PopoverContent>
		</Popover>
	);
}

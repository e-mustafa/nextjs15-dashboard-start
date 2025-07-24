import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '../ui-custom/custom-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export default function ShowHidePasswordButton({
	showPassword,
	setShowPassword,
	t,
}: {
	showPassword: boolean;
	setShowPassword: (value: boolean) => void;
	t: (key: string) => string;
}) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant='ghost'
						size='icon'
						type='button'
						data-slot='button'
						aria-label={showPassword ? t('inputs.hide_password') : t('inputs.show_password')}
						// title={showPassword ? t('inputs.hide_password') : t('inputs.show_password')}
						onClick={() => setShowPassword(!showPassword)}
						className='absolute top-1/2 -translate-y-1/2 end-1 size-7 text-muted-foreground p-1 '
					>
						{showPassword ? <EyeIcon /> : <EyeOffIcon />}
					</Button>
				</TooltipTrigger>
				<TooltipContent>{showPassword ? t('inputs.hide_password') : t('inputs.show_password')}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

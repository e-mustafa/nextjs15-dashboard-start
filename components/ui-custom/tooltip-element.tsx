import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export default function TooltipElement({
	children,
	content,
	delayDuration = 150,
}: {
	children: React.ReactNode;
	content: React.ReactNode | string;
	delayDuration?: number;
}) {
	return (
		<Tooltip delayDuration={delayDuration}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent>{content}</TooltipContent>
		</Tooltip>
		// <TooltipProvider></TooltipProvider>
	);
}

'use client';

import { useGProgressBarStore } from '@/stores/global-progress-bar.store';

export default function GlobalProgressBar() {
	const { processing } = useGProgressBarStore();

	return (
		// processing && ()
		<div
			data-processing={processing}
			className='relative w-[calc(100%-186px)] h-1 bg-primary/20 self-end transition-all data-[processing=true]:animate-fade-in data-[processing=true]:opacity-100 data-[processing=false]:opacity-0 data-[processing=false]:animate-fade-out'
		>
			<div
				data-processing={processing}
				className='absolute top-0 start-0 h-1 w-0 bg-primary data-[processing=true]:animate-progress-bar data-[processing=false]:animate-complete-and-fade'
			></div>
		</div>
	);
}

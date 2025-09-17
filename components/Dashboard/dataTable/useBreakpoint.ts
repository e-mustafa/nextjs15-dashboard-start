// ==============================
// app/(or src)/components/data-table/useBreakpoint.ts
// ==============================
'use client';

import { useEffect, useState } from 'react';

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';

// Tailwind default breakpoints
const queries: Record<Exclude<Breakpoint, 'base'>, string> = {
	sm: '(min-width: 640px)',
	md: '(min-width: 768px)',
	lg: '(min-width: 1024px)',
	xl: '(min-width: 1280px)',
};

export function useBreakpoint(): Breakpoint {
	const [bp, setBp] = useState<Breakpoint>('base');

	useEffect(() => {
		const mqs = Object.entries(queries).map(([k, q]) => [k, window.matchMedia(q)] as const);

		const update = () => {
			const active = (mqs.findLast(([, mq]) => mq.matches)?.[0] as Breakpoint) ?? 'base';
			setBp(active);
		};

		mqs.forEach(([, mq]) => mq.addEventListener?.('change', update));
		update();
		return () => mqs.forEach(([, mq]) => mq.removeEventListener?.('change', update));
	}, []);

	return bp;
}

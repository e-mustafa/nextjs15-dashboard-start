import { RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * useAutoCollapseColumns
 * - orderedColumnIds: array of column IDs in current table order (left→right)
 * - stickyCols: columns that must stay visible (e.g. select, actions, expander, pinned ones)
 * - userColumnVisibility: user's explicit visibility map { colId: boolean }
 * - autoCollapseEnabled: if false -> no auto collapse, show user-visible only (allow horizontal scroll)
 */
export default function useAutoCollapseColumns(
	tableContainerRef: RefObject<HTMLDivElement>,
	orderedColumnIds: string[],
	stickyCols: string[] = [],
	userColumnVisibility: Record<string, boolean> = {},
	autoCollapseEnabled: boolean = true
) {
	const [visibleCols, setVisibleCols] = useState<string[]>(orderedColumnIds);
	const [collapsedCols, setCollapsedCols] = useState<string[]>([]);
	const [autoHiddenCols, setAutoHiddenCols] = useState<Set<string>>(new Set());

	// stable key for user visibility
	const userVisKey = useMemo(() => {
		const keys = Object.keys(userColumnVisibility).sort();
		return keys.map((k) => `${k}:${userColumnVisibility[k] ? '1' : '0'}`).join('|');
	}, [userColumnVisibility]);

	const lastCollapsedRef = useRef<string[]>([]);
	const rafRef = useRef<number | null>(null);

	useLayoutEffect(() => {
		const el = tableContainerRef.current;
		if (!el) return;

		const recalculate = () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			rafRef.current = requestAnimationFrame(() => {
				const containerWidth = el.clientWidth;
				const table = el.querySelector('table');
				if (!table) return;

				// determine user-visible columns (respect user selection order = orderedColumnIds)
				const userVisible = orderedColumnIds.filter((id) =>
					userColumnVisibility[id] === undefined ? true : userColumnVisibility[id] === true
				);

				// if auto-collapse is disabled -> clear collapsed and expose userVisible only
				if (!autoCollapseEnabled) {
					// update only if changed
					const prevCollapsed = lastCollapsedRef.current;
					if (prevCollapsed.length !== 0 || visibleCols.join(',') !== userVisible.join(',')) {
						lastCollapsedRef.current = [];
						setCollapsedCols([]);
						setVisibleCols(userVisible);
						setAutoHiddenCols(new Set());
					}
					return;
				}

				// measure column header widths by data-colid
				const widthById = new Map<string, number>();
				for (const id of orderedColumnIds) {
					const th = table.querySelector<HTMLElement>(`th[data-colid="${id}"]`);
					const measured = th ? Math.max(th.offsetWidth, th.scrollWidth || 0) : 120;
					let w = Math.max(48, Math.round(measured));
					if (id === 'actions' || id === 'expander') w = 60;
					if (id === 'select') w = 50;
					widthById.set(id, w);
				}

				// subtract sticky widths (user-visible ones)
				const stickySet = new Set(stickyCols);
				const buffer = 120; // space for paddings/buttons etc
				let available = Math.max(0, containerWidth - buffer);
				stickyCols.forEach((id) => {
					if (userVisible.includes(id)) {
						available -= widthById.get(id) ?? 0;
					}
				});

				// quick-fit check: if total required fits -> clear collapsed
				const totalRequired = userVisible.reduce((s, id) => s + (widthById.get(id) ?? 120), 0);
				if (totalRequired <= containerWidth) {
					if (lastCollapsedRef.current.length !== 0) {
						lastCollapsedRef.current = [];
						setCollapsedCols([]);
						setVisibleCols(userVisible);
						setAutoHiddenCols(new Set());
					}
					return;
				}

				// greedy choose left-to-right among userVisible NON-sticky in the *orderedColumnIds* order
				const nonStickyOrdered = userVisible.filter((id) => !stickySet.has(id));
				const collapsed: string[] = [];
				let used = 0;
				for (const id of nonStickyOrdered) {
					const w = widthById.get(id) ?? 120;
					if (used + w <= Math.max(available, 0)) {
						used += w;
					} else {
						collapsed.push(id);
					}
				}

				// update only when changed (prevent loops)
				const prev = lastCollapsedRef.current;
				const changed = prev.length !== collapsed.length || !prev.every((v, i) => v === collapsed[i]);
				if (changed) {
					lastCollapsedRef.current = collapsed;
					setCollapsedCols(collapsed);
					setVisibleCols(userVisible.filter((id) => !collapsed.includes(id)));
					setAutoHiddenCols(new Set(collapsed));
				}
			});
		}; // recalculate

		const ro = new ResizeObserver(() => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(recalculate);
		});
		ro.observe(el);

		const mo = new MutationObserver((mutations) => {
			const significant = mutations.some(
				(m) => m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)
			);
			if (significant) {
				if (rafRef.current) cancelAnimationFrame(rafRef.current);
				rafRef.current = requestAnimationFrame(recalculate);
			}
		});
		mo.observe(el, { childList: true, subtree: true });

		// initial
		recalculate();

		return () => {
			ro.disconnect();
			mo.disconnect();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
		// depends on orderedColumnIds and primitives only
	}, [tableContainerRef, orderedColumnIds.join(','), stickyCols.join(','), userVisKey, autoCollapseEnabled]);

	return { visibleCols, collapsedCols, autoHiddenCols } as const;
}

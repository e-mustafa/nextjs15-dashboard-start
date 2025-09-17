import { Table } from '@tanstack/react-table';
import { RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react';

export default function useAutoCollapseColumns<T>(
	table: Table<T>,
	tableContainerRef: RefObject<HTMLDivElement>,
	stickyCols: string[] = [],
	userColumnVisibility: Record<string, boolean> = {},
	autoCollapseEnabled: boolean = true
) {
	const [visibleCols, setVisibleCols] = useState<string[]>([]);
	const [collapsedCols, setCollapsedCols] = useState<string[]>([]);

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
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				const containerWidth = el.clientWidth;

				const orderedColumnIds = table.getAllLeafColumns().map((c) => c.id);

				const userVisible = orderedColumnIds.filter((id) =>
					userColumnVisibility[id] === undefined ? true : userColumnVisibility[id] === true
				);

				if (!autoCollapseEnabled) {
					setVisibleCols(userVisible);
					setCollapsedCols([]);
					lastCollapsedRef.current = [];
					return;
				}

				const widthById = new Map<string, number>();
				for (const col of table.getAllLeafColumns()) {
					let w = col.getSize() ?? 120;
					if (col.id === 'actions' || col.id === 'expander') w = 60;
					if (col.id === 'select') w = 50;
					widthById.set(col.id, w);
				}

				const stickySet = new Set(stickyCols);
				let available = Math.max(0, containerWidth - 120);

				stickyCols.forEach((id) => {
					if (userVisible.includes(id)) available -= widthById.get(id) ?? 0;
				});

				const totalRequired = userVisible.reduce((s, id) => s + (widthById.get(id) ?? 120), 0);

				// ✅ update always, even if no collapse
				if (totalRequired <= containerWidth) {
					lastCollapsedRef.current = [];
					setCollapsedCols([]);
					setVisibleCols(userVisible);
					return;
				}

				const nonSticky = userVisible.filter((id) => !stickySet.has(id));
				const collapsed: string[] = [];
				let used = 0;

				for (const id of nonSticky) {
					const w = widthById.get(id) ?? 120;
					if (used + w <= available) {
						used += w;
					} else {
						collapsed.push(id);
					}
				}

				const prev = lastCollapsedRef.current;
				const changed = prev.length !== collapsed.length || !prev.every((v, i) => v === collapsed[i]);

				if (changed) {
					lastCollapsedRef.current = collapsed;
					setCollapsedCols(collapsed);
					setVisibleCols(userVisible.filter((id) => !collapsed.includes(id)));
				}
			});
		};

		const ro = new ResizeObserver(() => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(recalculate);
		});
		ro.observe(el);

		recalculate();

		return () => {
			ro.disconnect();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [table, tableContainerRef, stickyCols.join(','), userVisKey, autoCollapseEnabled]);

	return { visibleCols, collapsedCols, setCollapsedCols } as const;
}

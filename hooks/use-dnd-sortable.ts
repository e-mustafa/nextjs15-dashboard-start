import { DragEndEvent, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback } from 'react';

export function useDNDSortableSensors() {
	return useSensors(
		useSensor(PointerSensor),
		useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);
}

export function useDNDSortableDrag<T extends { id: string }>({
	items,
	move,
}: {
	items: T[];
	move: (oldIndex: number, newIndex: number) => void;
}) {
	const onDragEnd = useCallback(
		(e: DragEndEvent) => {
			const { active, over } = e;
			if (!over || active.id === over.id) return;

			const oldIndex = items.findIndex((f: T) => f.id === String(active.id));
			const newIndex = items.findIndex((f: T) => f.id === String(over.id));

			if (oldIndex !== -1 && newIndex !== -1) {
				move(oldIndex, newIndex);
			}
		},
		[items, move]
	);

	return onDragEnd;
}

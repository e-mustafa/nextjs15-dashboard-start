import { useDNDSortableDrag, useDNDSortableSensors } from '@/hooks/use-dnd-sortable';
import { closestCenter, DndContext, DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// =================================
// SORTABLE WRAPPER
// =================================
export function SortableDNDWrapper({
	id,
	children,
}: {
	id: string;
	children: (props: {
		setNodeRef: (el: HTMLElement | null) => void;
		listeners: SyntheticListenerMap | undefined;
		attributes: DraggableAttributes;
		style: React.CSSProperties;
	}) => React.ReactNode;
}) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
	const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
	return <>{children({ setNodeRef, listeners, attributes, style })}</>;
}

// =================================
// SORTABLE DND CONTEXT
// =================================
export function ReusableDNDSortable<T extends { id: string }>({
	items,
	move,
	children,
}: {
	items: T[];
	move: (oldIndex: number, newIndex: number) => void;
	children: React.ReactNode;
}) {
	const sensors = useDNDSortableSensors();
	const onDragEnd = useDNDSortableDrag({ items, move });

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
			<SortableContext items={items.map((f) => f.id)} strategy={verticalListSortingStrategy}>
				{children}
			</SortableContext>
		</DndContext>
	);
}

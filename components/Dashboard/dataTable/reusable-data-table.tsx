'use client';
import {
	Cell,
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	ColumnPinningState,
	Column as ColumnType,
	flexRender,
	getCoreRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	HeaderGroup,
	Header as HeaderType,
	PaginationState,
	Row,
	SortingState,
	Table as TableType,
	Updater,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table';
import {
	AArrowDownIcon,
	AArrowUpIcon,
	ArrowUpDownIcon,
	ChevronFirstIcon,
	ChevronLastIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CircleXIcon,
	Columns3Icon,
	EllipsisIcon,
	GripVerticalIcon,
	ListFilterIcon,
	PinIcon,
	PinOffIcon,
	ServerOffIcon,
	TrashIcon,
} from 'lucide-react';
import { Fragment, RefObject, useEffect, useId, useMemo, useRef, useState } from 'react';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui-custom/custom-alert-dialog';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui-custom/custom-button';
import { Checkbox } from '@/components/ui-custom/custom-checkbox';
import TooltipElement from '@/components/ui-custom/tooltip-element';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useIsClient from '@/hooks/useIsClient';
import useStorageState from '@/hooks/useStorageState';
import { ApiMeta, TQueryParams } from '@/types/api';
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import useAutoCollapseColumns from './useAutoCollapseColumns';

// ---------------------------------------------------------
// ⚙️ Table Global Configuration
// ---------------------------------------------------------
export const dataTable_configs = {
	EnableAutoCollapse: true,
	columnResizeMode: 'onChange' as 'onChange' | 'onEnd',
	defaultPinDirection: 'left' as 'left' | 'right',

	// Behavior configuration for each feature

	searchMode: 'server' as 'server' | 'hybrid',
	sortMode: 'hybrid' as 'client' | 'server' | 'hybrid',
};

// ---------------------------------------------------------
// ✅ Reusable Component
// ---------------------------------------------------------
interface ReusableDataTableProps<T extends { id: string }> {
	columns: ColumnDef<T>[];
	data?: T[];
	meta: ApiMeta;
	isPending?: boolean;
	totalItems?: number;
	onServerRequest?: (params: TQueryParams) => void;
	onDeleteSingleRow?: (selectedRow: string) => void;
	onDeleteRows?: (selectedRows: string[]) => void;
	onUpdateUrl?: (params: Record<string, string | number | undefined>) => void;
}

export default function ReusableDataTable<T extends { id: string }>({
	columns,
	data = [],
	isPending = false,
	totalItems,
	onServerRequest,
	onDeleteRows,
	onDeleteSingleRow,
	meta = { pagination: { page: 1, limit: 10, total: data.length, totalPages: 1 } },
	onUpdateUrl,
}: ReusableDataTableProps<T>) {
	const isClient = useIsClient();
	const { t } = useTranslation();
	const id = useId();
	const searchParams = useSearchParams();

	// ⚙️ Configurable modes (kept stable using useMemo)
	const SEARCH_MODE: 'server' | 'hybrid' = useMemo(() => 'hybrid', []);
	const SORT_MODE: 'local' | 'server' | 'hybrid' = useMemo(() => 'server', []);

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
	const [autoCollapseEnabled, setAutoCollapseEnabled] = useStorageState<boolean>(
		'Auto-Collapse',
		dataTable_configs.EnableAutoCollapse
	);
	const [columnVisibility, setColumnVisibility] = useStorageState<VisibilityState>('Visible-Columns', {});
	const [columnPinning, setColumnPinning] = useStorageState<ColumnPinningState>('Column-Pinning', { left: [], right: [] });
	const tableRef = useRef(null!) as RefObject<HTMLDivElement>;
	const inputRef = useRef<HTMLInputElement>(null);

	type AccessorColumnDef<T> = ColumnDef<T> & { accessorKey: string };
	const [sorting, setSorting] = useState<SortingState>([
		{
			// if no sort in URL, use first column
			id: searchParams.get('sortBy') || (columns[0] as AccessorColumnDef<T>).accessorKey || 'name',
			desc: searchParams.get('sortOrder') === 'desc',
		},
	]);

	console.log('meta table --', meta);

	const [pagination, setPagination] = useState<PaginationState>(() => ({
		pageIndex: meta?.pagination?.page ? meta.pagination.page - 1 : 0,
		pageSize: meta?.pagination?.limit || 10,
	}));

	const isAllDataLoaded = totalItems ? data.length === totalItems : true;
	const [globalFilter, setGlobalFilter] = useState<string>('');

	// 🔍 Handle global search
	function globalFilterFn(value: string) {
		const val = String(value).trim();
		setGlobalFilter(val);

		// Hybrid or server-only search
		if (SEARCH_MODE === 'server' || (SEARCH_MODE === 'hybrid' && !isAllDataLoaded)) {
			onServerRequest?.({ search: val });
			onUpdateUrl?.({ search: val });
		}
	}

	// 🔽 Handle sorting (local/server/hybrid)
	function handleSorting(updater: Updater<SortingState>) {
		const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
		setSorting(newSorting);

		const sort = newSorting[0];
		if (!sort) return;

		const sortParams = {
			sortBy: sort.id,
			sortOrder: sort.desc ? 'desc' : ('asc' as 'asc' | 'desc'),
		};

		// ✅ Always update URL
		onUpdateUrl?.(sortParams);

		// 🚀 Trigger server request only if needed
		if (SORT_MODE === 'server' || (SORT_MODE === 'hybrid' && !isAllDataLoaded)) {
			onServerRequest?.(sortParams);
		}
	}

	// 🧩 Collapse management
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	function toggleExpandRow(id: string) {
		setExpandedRows((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	}
	function toggleExpandRowAll() {
		const rowsCount = table.getRowModel().rows?.length;
		setExpandedRows((prev) => (prev.size >= rowsCount ? new Set() : new Set(table.getRowModel().rows.map((r) => r.id))));
	}

	const selectColumn = {
		id: 'select',
		header: ({ table }: { table: TableType<T> }) => (
			<Checkbox
				className='bg-background border-primary'
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }: { row: Row<T> }) => (
			<Checkbox
				className='bg-background ms-2'
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
			/>
		),
		size: 28,
		maxSize: 28,
		enableSorting: false,
		enableHiding: false,
		enablePinning: false,
		enableGrouping: false,
	};

	const ActionColumns = {
		id: 'actions',
		header: () => <span className='sr-only'>Actions</span>,
		cell: ({ row }: { row: Row<T> }) => <RowActions row={row} handleDeleteRow={handleDeleteRow} />,
		size: 40,
		maxSize: 40,
		enableHiding: false,
		enableGroping: false,
		enablePinning: false,
	};

	const collapsingColumn = {
		id: 'expander',
		header: () => (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant='ghost' size='icon' onClick={toggleExpandRowAll}>
						<ChevronRightIcon
							className={cn(
								'size-5 transform transition-all duration-300',
								expandedRows.size > 0 ? 'rotate-90' : 'rotate-0'
							)}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{expandedRows.size > 0 ? t('datatable.collapse_all') : t('datatable.expand_all')}</p>
				</TooltipContent>
			</Tooltip>
		),
		cell: ({ row }: { row: Row<any> }) => (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant='ghost'
						size='icon'
						onClick={(e) => {
							e.stopPropagation();
							toggleExpandRow(row.id);
						}}
					>
						<ChevronRightIcon
							className={cn(
								'size-5 transform transition-transform duration-300',
								expandedRows.has(row.id) ? 'rotate-90' : 'rotate-0'
							)}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{expandedRows.has(row.id) ? t('datatable.collapse_columns') : t('datatable.expand_column')}</p>
				</TooltipContent>
			</Tooltip>
		),
		maxSize: 40,
		size: 40,
		enableSorting: false,
		enableHiding: false,
		enablePinning: false,
		enableGrouping: false,
	};

	const [mergedColumns, setMergedColumns] = useState<ColumnDef<T>[]>([selectColumn, ...columns, ActionColumns]);

	// 🧮 Table setup
	const table = useReactTable({
		data,
		columns: mergedColumns,
		state: {
			sorting,
			pagination,
			columnFilters,
			columnVisibility,
			columnOrder,
			columnPinning,
			globalFilter,
		},
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: handleSorting,
		getPaginationRowModel: getPaginationRowModel(),
		enableSortingRemoval: false,
		onPaginationChange: setPagination,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnOrderChange: setColumnOrder,
		onColumnPinningChange: setColumnPinning,
		debugTable: false,
	});

	// Auto collapse
	const firstColKey = columns[0]?.id || 'name';
	const { visibleCols, collapsedCols, setCollapsedCols } = useAutoCollapseColumns(
		table,
		tableRef,
		['select', firstColKey, 'expander', 'actions'],
		columnVisibility,
		autoCollapseEnabled
	);

	useEffect(() => {
		let updated = [...mergedColumns];
		const exists = updated.some((c) => c.id === 'expander');
		if (collapsedCols.length > 0 && !exists) {
			updated.splice(updated.length - 1, 0, collapsingColumn);
		} else if (collapsedCols.length === 0 && exists) {
			updated = updated.filter((c) => c.id !== 'expander');
		}
		setMergedColumns(updated);
	}, [collapsedCols, visibleCols, autoCollapseEnabled]);

	// Deletion handlers
	const handleDeleteRow = (id: string) => onDeleteSingleRow?.(id);
	const handleDeleteRows = () => {
		const selected = table.getSelectedRowModel().rows.map((r) => r.original.id) as unknown as string[];
		onDeleteRows?.(selected);
		table.resetRowSelection();
	};

	// Pagination handler
	function handlePageChange(newPage: number) {
		setPagination((prev) => ({ ...prev, pageIndex: newPage }));
		onServerRequest?.({ page: newPage + 1 });
		onUpdateUrl?.({ page: newPage + 1 });
	}

	// DnD columns
	const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const current = table.getState().columnOrder.length
			? table.getState().columnOrder
			: table.getAllLeafColumns().map((c) => c.id);
		const oldIndex = current.indexOf(active.id as string);
		const newIndex = current.indexOf(over.id as string);
		if (oldIndex === -1 || newIndex === -1) return;
		const newOrder = arrayMove(current, oldIndex, newIndex);
		table.setColumnOrder(newOrder);
		localStorage.setItem('Columns-Order', JSON.stringify(newOrder));
	}

	// 🖼️ Render
	return (
		<div className='relative space-y-4 w-full'>
			{/* Search and column controls */}
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex items-center flex-wrap gap-3'>
					{/* Search input */}
					<div className='relative'>
						<Input
							id={`${id}-input`}
							ref={inputRef}
							className={cn('peer min-w-60 px-9')}
							placeholder={t('forms.search.placeholder')}
							type='text'
							value={globalFilter}
							onChange={(e) => globalFilterFn(e.target.value)}
							aria-label={t('forms.search.placeholder')}
							disabled={isPending || data.length === 0}
						/>
						<div className='text-muted-foreground/80 absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none'>
							<ListFilterIcon size={16} />
						</div>
						{Boolean(globalFilter) && (
							<button
								className='absolute inset-y-0 end-0 flex items-center justify-center w-9 text-muted-foreground/80 hover:text-foreground'
								onClick={() => globalFilterFn('')}
							>
								<CircleXIcon size={16} />
							</button>
						)}
					</div>

					{/* Column visibility */}
					<ColumnVisibilityDropdown
						table={table}
						collapsedCols={collapsedCols}
						setCollapsedCols={setCollapsedCols}
						autoCollapseEnabled={autoCollapseEnabled}
						setAutoCollapseEnabled={setAutoCollapseEnabled}
					/>
				</div>

				{/* Bulk delete */}
				{table.getSelectedRowModel().rows.length > 0 && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant='destructive'>
								<TrashIcon size={16} className='-ms-1 opacity-60' />
								{t('common.actions.delete_selected')}
								<span className='bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-medium'>
									{table.getSelectedRowModel().rows.length}
								</span>
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent className='bg-accent/20 backdrop-blur-sm'>
							<AlertDialogHeader className='gap-4'>
								<AlertDialogTitle>{t('common.actions.delete_confirm')}</AlertDialogTitle>
								<AlertDialogDescription className='whitespace-pre-line'>
									{t('common.messages.delete_selected_confirm', { count: table.getSelectedRowModel().rows.length })}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
								<AlertDialogAction
									variant='destructive'
									disabled={table.getSelectedRowModel().rows.length === 0}
									onClick={handleDeleteRows}
								>
									{`${t('common.actions.delete')} ${table.getSelectedRowModel().rows.length}`}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</div>

			{/* Table */}
			<div ref={tableRef} className='relative bg-background overflow-hidden rounded-md border w-full'>
				{isClient ? (
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
						<SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
							<TableComponent
								table={table}
								visibleCols={visibleCols}
								collapsedCols={collapsedCols}
								columnVisibility={columnVisibility}
								expandedRows={expandedRows}
							/>
						</SortableContext>
					</DndContext>
				) : (
					<TableComponent
						table={table}
						visibleCols={visibleCols}
						collapsedCols={collapsedCols}
						columnVisibility={columnVisibility}
						expandedRows={expandedRows}
					/>
				)}
			</div>

			{/* Pagination */}
			<div className='flex items-center justify-between flex-wrap gap-6'>
				<div className='flex items-center gap-3 order-1'>
					<Label htmlFor={id} className='text-xs font-normal'>
						{t('pagination.rows_per_page')}
					</Label>
					<Select
						value={table.getState().pagination.pageSize.toString()}
						onValueChange={(value) => table.setPageSize(Number(value))}
					>
						<SelectTrigger className='w-fit'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[10, 25, 50, 100].map((pageSize) => (
								<SelectItem key={pageSize} value={pageSize.toString()}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{data.length > 0 && !isPending && (
					<div className='text-muted-foreground text-sm order-3 flex gap-2 items-center'>
						<span>{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>-
						<span>
							{Math.min(
								(table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
								table.getRowCount()
							)}
						</span>
						<span>{t('pagination.of')}</span>
						{totalItems || table.getRowCount()}
					</div>
				)}

				{!isAllDataLoaded && (
					<Pagination className='flex-none order-last lg:flex-1 lg:order-2'>
						<PaginationContent>
							<PaginationItem>
								<Button
									size='icon'
									variant='outline'
									onClick={() => handlePageChange(0)}
									disabled={table.getState().pagination.pageIndex === 0}
								>
									<ChevronFirstIcon size={16} className='rtl:rotate-180' />
								</Button>
							</PaginationItem>
							<PaginationItem>
								<Button
									size='icon'
									variant='outline'
									onClick={() => handlePageChange(Math.max(0, table.getState().pagination.pageIndex - 1))}
									disabled={table.getState().pagination.pageIndex === 0}
								>
									<ChevronLeftIcon size={16} className='rtl:rotate-180' />
								</Button>
							</PaginationItem>
							<PaginationItem>
								<Button
									size='icon'
									variant='outline'
									onClick={() =>
										handlePageChange(Math.min(table.getPageCount() - 1, table.getState().pagination.pageIndex + 1))
									}
									disabled={table.getState().pagination.pageIndex >= table.getPageCount() - 1}
								>
									<ChevronRightIcon size={16} className='rtl:rotate-180' />
								</Button>
							</PaginationItem>
							<PaginationItem>
								<Button
									size='icon'
									variant='outline'
									onClick={() => handlePageChange(table.getPageCount() - 1)}
									disabled={table.getState().pagination.pageIndex >= table.getPageCount() - 1}
								>
									<ChevronLastIcon size={16} className='rtl:rotate-180' />
								</Button>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				)}
			</div>
		</div>
	);
}

export function togglePin<T>(e: React.MouseEvent, column: ColumnType<T, unknown>) {
	e.preventDefault();
	e.stopPropagation();
	if (column.getIsPinned()) {
		column.pin(false);
	} else {
		column.pin('left'); // ✅ فقط left
	}
}

function SortableColumnItem<T>({ column }: { column: ColumnType<T, unknown> }) {
	const { t } = useTranslation();
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: column.id,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			className='flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-muted/40'
		>
			<span
				{...listeners}
				className='cursor-grab size-9 shrink-0 grid place-items-center opacity-50 hover:opacity-80 hover:[&>svg]:scale-125 transition-all duration-300'
			>
				<GripVerticalIcon size={16} aria-label='grab' />
			</span>

			<DropdownMenuCheckboxItem
				checked={column.getIsVisible()}
				onCheckedChange={(checked) => column.toggleVisibility(checked as boolean)}
				onSelect={(e) => e.preventDefault()}
				className='hover:bg-transparent! grow justify-start'
			>
				<span className='capitalize line-clamp-1'>{t(`columns.${column.id}`, { defaultValue: column.id })}</span>
			</DropdownMenuCheckboxItem>

			{/* Pin toggle button */}
			<TooltipElement content={<p>{column.getIsPinned() ? t('datatable.unpin_column') : t('datatable.pin_column')}</p>}>
				<Button variant='ghost' size='icon' onClick={(e) => togglePin(e, column)}>
					{column.getIsPinned() ? (
						<PinOffIcon size={16} className='opacity-70 text-primary' />
					) : (
						<PinIcon size={16} className='opacity-70' />
					)}
				</Button>
			</TooltipElement>
		</div>
	);
}

type TColumnVisibilityDropdown<T> = {
	table: TableType<T>;
	collapsedCols: string[];
	setCollapsedCols: (cols: string[]) => void;
	autoCollapseEnabled: boolean;
	setAutoCollapseEnabled: (v: boolean) => void;
};

export function ColumnVisibilityDropdown<T>({
	table,
	collapsedCols,
	setCollapsedCols,
	autoCollapseEnabled,
	setAutoCollapseEnabled,
}: TColumnVisibilityDropdown<T>) {
	const { t } = useTranslation();
	const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

	// ✅ able column to hidden
	const allColumns = table.getAllLeafColumns();
	const hidableColumns = allColumns.filter((c) => c.getCanHide());

	// ✅ pinned column in first
	const pinned = hidableColumns.filter((c) => c.getIsPinned());
	const unpinned = hidableColumns.filter((c) => !c.getIsPinned());

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = allColumns.findIndex((c) => c.id === active.id);
		const newIndex = allColumns.findIndex((c) => c.id === over.id);

		// ✅ update column order
		const newOrder = arrayMove(table.getState().columnOrder, oldIndex, newIndex);
		table.setColumnOrder(newOrder);

		// ✅ update collapsed columns based on new order
		if (collapsedCols.length > 0) {
			const stillValid = collapsedCols.filter((id) => newOrder.includes(id));
			const newCollapsed: string[] = [];

			newOrder.forEach((colId) => {
				if (stillValid.includes(colId)) {
					newCollapsed.push(colId);
				}
			});

			setCollapsedCols(newCollapsed);
		}

		// save to local storage
		localStorage.setItem('Columns-Order', JSON.stringify(newOrder));
	}

	return (
		<DropdownMenu dir='rtl'>
			<DropdownMenuTrigger asChild>
				<Button variant='outline'>
					<Columns3Icon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
					{t('datatable.columns')}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align='center' className='w-64'>
				<DropdownMenuLabel>{t('datatable.manage_columns')}</DropdownMenuLabel>
				{/* Toggle AutoCollapse */}
				<span className='px-2 py-1 text-xs font-semibold text-muted-foreground'>
					{t('datatable.collapse_or_scroll')}
				</span>
				<div className='flex items-center p-2'>
					{/* <Label htmlFor='Auto-Collapse'>{t('datatable.scroll')}</Label> */}
					<Label htmlFor='Auto-Collapse' className='grow'>
						{t('datatable.auto_collapse')}
					</Label>
					<Switch
						id='Auto-Collapse'
						dir='ltr'
						checked={autoCollapseEnabled}
						onCheckedChange={(value) => setAutoCollapseEnabled(value)}
						aria-label='Auto-Collapse'
						aria-checked={autoCollapseEnabled}
						aria-labelledby='Auto-Collapse'
						className='data-[state=unchecked]:!bg-accent/50 scale-125xxx me-auto duration-300 ease-in-out rotate-180'
					/>
				</div>

				<DropdownMenuSeparator className='bg-gray-600' />

				<DropdownMenuLabel>{t('datatable.columns_control')}</DropdownMenuLabel>

				{/* ✅ pinned columns first*/}
				{pinned.length > 0 && (
					<>
						{/* <div className='px-2 py-1 text-xs font-semibold text-muted-foreground'>Pinned</div> */}
						{pinned.map((column) => (
							<div
								key={column.id}
								className='flex items-center justify-between gap-2 px-2 py-1 hover:bg-muted/40 rounded'
							>
								<DropdownMenuCheckboxItem
									checked={column.getIsVisible()}
									onCheckedChange={(checked) => column.toggleVisibility(checked as boolean)}
									onSelect={(e) => e.preventDefault()}
									className='hover:bg-transparent!'
								>
									<span className='capitalize line-clamp-1'>
										{t(`columns.${column.id}`, { defaultValue: column.id })}
									</span>
								</DropdownMenuCheckboxItem>

								<TooltipElement content={<p>{t('datatable.unpin_column')}</p>}>
									<Button
										variant='ghost'
										size='icon'
										onClick={(e) => togglePin(e, column as unknown as ColumnType<T>)}
									>
										<PinOffIcon size={16} className='opacity-70 text-primary' />
									</Button>
								</TooltipElement>
							</div>
						))}
						<DropdownMenuSeparator />
					</>
				)}
				{/* ✅ Draggable list for unpinned */}
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext items={unpinned.map((c) => c.id)} strategy={verticalListSortingStrategy}>
						{unpinned.map((column) => (
							<SortableColumnItem key={column.id} column={column as unknown as ColumnType<T>} />
						))}
					</SortableContext>
				</DndContext>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function RowActions<T>({ row, handleDeleteRow }: { row: Row<T>; handleDeleteRow?: (id: string) => void }) {
	const { t } = useTranslation();
	const pathname = usePathname();
	const [openSingle, setOpenSingle] = useState(false);

	useEffect(() => {
		if (openSingle) {
			document.body.style.pointerEvents = '';
		}
	}, [openSingle]);

	return (
		<div>
			<AlertDialog open={openSingle} onOpenChange={setOpenSingle}>
				{/* <AlertDialogTrigger asChild>
					<DropdownMenuItem className='text-destructive focus:text-destructive'>
						<span>Delete</span>
						<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
					</DropdownMenuItem>
				</AlertDialogTrigger> */}
				<AlertDialogContent className='bg-accent/20 backdrop-blur-sm'>
					<AlertDialogHeader className='gap-4'>
						<AlertDialogTitle>{t('common.actions.delete_confirm')}</AlertDialogTitle>
						<AlertDialogDescription className='whitespace-pre-line'>
							{' '}
							{t('common.messages.delete_confirm')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setOpenSingle(false)}>{t('common.actions.cancel')}</AlertDialogCancel>
						<AlertDialogAction
							variant='destructive'
							onClick={handleDeleteRow ? () => handleDeleteRow((row.original as T & { id: string }).id) : undefined}
						>
							{t('common.actions.delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<div className='flex justify-end'>
						<Button size='icon' variant='ghost' className='shadow-none' aria-label='Edit item'>
							<EllipsisIcon size={16} aria-hidden='true' />
						</Button>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='start'>
					<DropdownMenuGroup>
						<DropdownMenuItem asChild>
							<Link
								href={`${pathname}/${(row.original as T & { id: string }).id}`}
								onClick={(e) => e.stopPropagation()}
								className='flex gap-2 justify-between'
							>
								<span>{t('common.actions.edit')}</span>
								<DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<span>Duplicate</span>
							<DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<span>Archive</span>
							<DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<DropdownMenuItem>Move to project</DropdownMenuItem>
									<DropdownMenuItem>Move to folder</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem>Advanced options</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>Share</DropdownMenuItem>
						<DropdownMenuItem>Add to favorites</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />

					<DropdownMenuItem className='text-destructive focus:text-destructive' onClick={() => setOpenSingle(true)}>
						<span>Delete</span>
						<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

// ✅ helpers
function getPinnedStyle<T>(column: ColumnType<T>): React.CSSProperties {
	if (!column.getIsPinned()) return {};

	const isLeft = column.getIsPinned() === 'left';
	const offset = column.getStart('left'); // tanstack calculates offset automatically px

	return {
		position: 'sticky',
		// [isLeft ? 'left' : 'right']: offset,
		// [dir]: offset,
		insetInlineStart: offset,
		zIndex: 2,
		// background: 'var(--background)', // bg-accent
	};
}

function getOrderedHeaders<T>(headerGroup: HeaderGroup<T>) {
	const selectCol = headerGroup.headers.filter((h) => h.column.id === 'select');
	const pinnedLeft = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'left');
	const center = headerGroup.headers.filter(
		(h) => !['select', 'expander', 'actions'].includes(h.column.id) && !h.column.getIsPinned()
	);
	const pinnedRight = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'right');
	const endCols = headerGroup.headers.filter((h) => ['expander', 'actions'].includes(h.column.id));

	return [...selectCol, ...pinnedLeft, ...center, ...pinnedRight, ...endCols];
}

function getOrderedCells<T>(row: Row<T>) {
	const cells = row.getAllCells();
	const selectCell = cells.filter((c) => c.column.id === 'select');
	const pinnedLeft = cells.filter((c) => c.column.getIsPinned() === 'left');
	const center = cells.filter((c) => !['select', 'expander', 'actions'].includes(c.column.id) && !c.column.getIsPinned());
	const pinnedRight = cells.filter((c) => c.column.getIsPinned() === 'right');
	const endCells = cells.filter((c) => ['expander', 'actions'].includes(c.column.id));

	return [...selectCell, ...pinnedLeft, ...center, ...pinnedRight, ...endCells];
}

// ✅ SortableHeader
export function SortableHeader<T>({ header }: { header: HeaderType<T, unknown> }) {
	const { t } = useTranslation();
	const directionStart = 'left';

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: header.column.id,
	});

	function handlePinning(e: React.MouseEvent, column: ColumnType<T>) {
		e.preventDefault();
		e.stopPropagation();
		const pinDirection = dataTable_configs.defaultPinDirection || directionStart;
		column.pin(column.getIsPinned() ? false : pinDirection);
	}

	const style_all: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		...getPinnedStyle(header.column),
	};

	const sortDirection = header.column.getIsSorted() as 'asc' | 'desc' | false;

	const headerLabel =
		typeof header.column.columnDef.header === 'string'
			? t(header.column.columnDef.header)
			: flexRender(header.column.columnDef.header, header.getContext());

	return (
		<TableHead
			key={header.id}
			data-colid={header.column.id}
			data-pinned={header.column.getIsPinned()}
			ref={setNodeRef}
			style={style_all}
			className='group h-11 px-2 text-start'
		>
			{header.isPlaceholder ? null : (
				<div
					className='flex h-full items-center justify-between gap-2 select-none group hover:bg-muted/30 px-2 cursor-pointer'
					onClick={header.column.getToggleSortingHandler()}
					tabIndex={0}
				>
					<p className='grow'>{headerLabel}</p>
					{/* sort icons */}
					{header.column.getCanSort() &&
						(sortDirection === 'asc' ? (
							<AArrowUpIcon
								className='shrink-0 opacity-60 text-primary group-hover:scale-125 animate-in zoom-in-75'
								size={20}
							/>
						) : sortDirection === 'desc' ? (
							<AArrowDownIcon
								className='shrink-0 opacity-60 text-primary group-hover:scale-125 animate-in zoom-in-75'
								size={20}
							/>
						) : (
							<ArrowUpDownIcon
								className='shrink-0 opacity-60 group-hover:text-primary group-hover:scale-125 animate-in zoom-in-75'
								size={16}
							/>
						))}
					{/* pin button */}
					{header.column.getCanPin() && (
						<TooltipElement
							content={header.column.getIsPinned() ? t('datatable.unpin_column') : t('datatable.pin_column')}
						>
							<Button
								variant='ghost'
								size='icon'
								onClick={(e) => handlePinning(e, header.column)}
								className='hover:[&>*]:scale-125 [&>*]:transition-all duration-300'
							>
								{header.column.getIsPinned() ? (
									<PinOffIcon
										className='shrink-0 opacity-60 group-hover:text-primary animate-in zoom-in-75'
										size={16}
									/>
								) : (
									<PinIcon
										className='shrink-0 opacity-60 group-hover:text-primary animate-in zoom-in-75'
										size={16}
									/>
								)}
							</Button>
						</TooltipElement>
					)}
					{/* drag handle */}
					{header.column.getCanGroup() && (
						<span
							{...attributes}
							{...listeners}
							className="grab-handel group-data-[pinned='false']:cursor-grab h-full grid place-items-center opacity-50 hover:opacity-80 hover:[&>*]:scale-125 transition-all duration-300"
						>
							<GripVerticalIcon className='shrink-0' size={20} />
						</span>
					)}
				</div>
			)}
		</TableHead>
	);
}

// ✅ MainRow
export function MainRow<T>({
	row,
	visibleCols,
	columnVisibility,
	collapsedCols,
	expandedRows,
}: {
	row: Row<T>;
	visibleCols: string[];
	columnVisibility: VisibilityState;
	collapsedCols: string[];
	expandedRows: Set<string>;
}) {
	function shouldShowColumn(id: string) {
		if (['select', 'actions'].includes(id)) return true;
		if (id === 'expander' && collapsedCols.length > 0) {
			return collapsedCols.some((colId: string) => columnVisibility[colId] !== false);
		}
		return columnVisibility[id] !== false && visibleCols.includes(id);
	}

	return (
		<TableRow
			data-rowid={row.id}
			data-state={row.getIsSelected() && 'selected'}
			data-expanded={expandedRows.has(row.id)}
			className={cn(
				'group cursor-pointer hover:bg-muted/50 data-[expand=true]:bg-muted/40',
				expandedRows.has(row.id) && 'has-expanded bg-muted/40 border-b-0'
			)}
			onClick={() => row.toggleSelected()}
		>
			{getOrderedCells(row)
				.filter((cell) => shouldShowColumn(cell.column.id))
				.map((cell) => (
					<TableCell
						className='px-1.5'
						key={cell.id}
						data-pinned={cell.column.getIsPinned()}
						style={getPinnedStyle(cell.column)}
					>
						<div className='line-clamp-1'>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
					</TableCell>
				))}
		</TableRow>
	);
}

// ✅ ExpandedRow
export function ExpandedRow<T>({
	row,
	collapsedCols,
	columnVisibility,
	expandedRows,
	table,
}: {
	row: Row<T>;
	collapsedCols: string[];
	columnVisibility: VisibilityState;
	expandedRows: Set<string>;
	table: TableType<T>;
}) {
	const { t } = useTranslation();

	if (!expandedRows.has(row.id)) return null;
	const hasVisibleCollapsed = collapsedCols.some((id: string) => columnVisibility[id] !== false);
	if (!hasVisibleCollapsed) return null;

	return (
		<TableRow
			data-rowid={row.id}
			data-state={row.getIsSelected() && 'selected'}
			className={cn('expanded-row group', expandedRows.has(row.id) && 'bg-muted/20')}
		>
			<TableCell colSpan={table.getVisibleLeafColumns().length + 1} className='p-0'>
				<div className='grid grid-cols-[40px_auto]'>
					<span
						onClick={() => row.toggleSelected()}
						className='row-span-full group-data-[state="selected"]:bg-muted data-[expand=true]:bg-muted/40 hover:bg-muted/50 cursor-pointer transition-all duration-300'
					></span>
					<div className='grid gap-2 sm:grid-cols-2 md:grid-cols-3 p-2'>
						{collapsedCols
							.filter((colId: string) => columnVisibility[colId] !== false)
							.map((colId: string) => {
								const cell = row.getAllCells().find((c: Cell<T, unknown>) => c.column.id === colId);
								const headerLabel = table.getColumn(colId)?.columnDef.header ?? colId;
								return (
									<div key={colId} className='flex items-center gap-2'>
										<span className='text-xs text-muted-foreground font-medium'>{t(headerLabel as string)}:</span>
										<span className='font-medium line-clamp-1'>
											{cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : row.getValue(colId)}
										</span>
									</div>
								);
							})}
					</div>
				</div>
			</TableCell>
		</TableRow>
	);
}

export function TableComponent<T>({
	table,
	visibleCols,
	collapsedCols,
	columnVisibility,
	expandedRows,
}: {
	table: TableType<T>;
	visibleCols: string[];
	collapsedCols: string[];
	columnVisibility: VisibilityState;
	expandedRows: Set<string>;
}) {
	const { t } = useTranslation();

	// ✅ calculate pinned columns offsets using ResizeObserver
	const [colOffsets, setColOffsets] = useState<Record<string, number>>({});

	useEffect(() => {
		const observer = new ResizeObserver(() => {
			const ths = document.querySelectorAll('th[data-colid]');
			const offsets: Record<string, number> = {};
			let left = 0;
			let right = 0;

			table.getAllLeafColumns().forEach((col: ColumnType<T>) => {
				if (col.getIsPinned() === 'left') {
					offsets[col.id] = left;
					const el = document.querySelector(`th[data-colid="${col.id}"]`) as HTMLElement;
					if (el) left += el.offsetWidth;
				}
			});

			[...table.getAllLeafColumns()].reverse().forEach((col: ColumnType<T>) => {
				if (col.getIsPinned() === 'right') {
					offsets[col.id] = right;
					const el = document.querySelector(`th[data-colid="${col.id}"]`) as HTMLElement;
					if (el) right += el.offsetWidth;
				}
			});

			setColOffsets(offsets);
		});

		const container = document.querySelector('.table-container');
		if (container) observer.observe(container);

		return () => observer.disconnect();
	}, [table]);

	function shouldShowColumn(id: string, visibleCols: string[], collapsedCols: string[], columnVisibility: VisibilityState) {
		if (['select', 'actions'].includes(id)) return true;
		if (id === 'expander' && collapsedCols.length > 0) {
			return collapsedCols.some((colId) => columnVisibility[colId] !== false);
		}
		return columnVisibility[id] !== false && visibleCols.includes(id);
	}

	return (
		<div className='table-container overflow-x-auto w-full'>
			<Table className='table-auto w-full'>
				{/* Header */}
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id} className='bg-primary/10 hover:bg-primary/10'>
							{getOrderedHeaders(headerGroup)
								.filter((h) => shouldShowColumn(h.column.id, visibleCols, collapsedCols, columnVisibility))
								.map((h) => (
									<SortableHeader key={h.id} header={h} />
								))}
						</TableRow>
					))}
				</TableHeader>

				{/* Body */}
				<TableBody>
					{table.getRowModel().rows.length ? (
						table.getRowModel().rows.map((row: Row<T>) => (
							<Fragment key={row.id}>
								<MainRow
									row={row}
									visibleCols={visibleCols}
									columnVisibility={columnVisibility}
									collapsedCols={collapsedCols}
									expandedRows={expandedRows}
								/>
								<ExpandedRow
									row={row}
									collapsedCols={collapsedCols}
									columnVisibility={columnVisibility}
									expandedRows={expandedRows}
									table={table}
								/>
							</Fragment>
						))
					) : (
						<TableRow>
							<TableCell colSpan={visibleCols.length + 1}>
								<div className='h-40 my-6 text-center grid place-items-center text-muted-foreground capitalize'>
									<ServerOffIcon size={60} />
									{t('datatable.no_data')}
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}

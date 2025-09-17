'use client';
import {
	Cell,
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	ColumnPinningState,
	Column as columnType,
	Column as ColumnType,
	FilterFn,
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
	CircleAlertIcon,
	CircleXIcon,
	Columns3Icon,
	CopyPlusIcon,
	EllipsisIcon,
	FileUpIcon,
	FilterIcon,
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { Switch } from '@/components/ui/switch';
import DebouncedInput from '@/hooks/debouncedInput';
import useIsClient from '@/hooks/useIsClient';
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
import { useTranslation } from 'react-i18next';
import useAutoCollapseColumns from './useAutoCollapseColumns';

type Item = {
	id: string;
	name: string;
	email: string;
	location: string;
	flag: string;
	status: 'Active' | 'Inactive' | 'Pending';
	balance: number;
};

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Item> = (row, columnId, filterValue) => {
	const searchableRowContent = `${row.original.name} ${row.original.email}`.toLowerCase();
	const searchTerm = (filterValue ?? '').toLowerCase();
	return searchableRowContent.includes(searchTerm);
};

const statusFilterFn: FilterFn<Item> = (row, columnId, filterValue: string[]) => {
	if (!filterValue?.length) return true;
	const status = row.getValue(columnId) as string;
	return filterValue.includes(status);
};

const selectColumn = {
	id: 'select',
	header: ({ table }: { table: TableType<Item> }) => (
		<Checkbox
			className='bg-background border-primary ms-2'
			checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
			onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			aria-label='Select all'
		/>
	),
	cell: ({ row }: { row: Row<Item> }) => (
		<Checkbox
			className='bg-background ms-2'
			checked={row.getIsSelected()}
			onCheckedChange={(value) => row.toggleSelected(!!value)}
			aria-label='Select row'
		/>
	),
	size: 28,
	enableSorting: false,
	enableHiding: false,
};

const ActionColumns = {
	id: 'actions',
	header: () => <span className='sr-only'>Actions</span>,
	cell: ({ row }: { row: Row<Item> }) => <RowActions row={row} />,
	size: 60,
	enableHiding: false,
};

// columns -------------------------------------------
const columns: ColumnDef<Item>[] = [
	{
		header: 'Name',
		accessorKey: 'name',
		cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>,
		// size: 180,
		filterFn: multiColumnFilterFn,
		// enableHiding: false,
		enablePinning: true,
	},
	{
		header: 'Email',
		accessorKey: 'email',
		enablePinning: true,
		// size: 220,
	},
	{
		header: 'Location',
		accessorKey: 'location',
		cell: ({ row }) => (
			<div>
				<span className='text-lg leading-none'>{row.original.flag}</span> {row.getValue('location')}
			</div>
		),
		// size: 180,
		enablePinning: true,
	},
	{
		header: 'Status',
		accessorKey: 'status',
		cell: ({ row }) => (
			<Badge className={cn(row.getValue('status') === 'Inactive' && 'bg-muted-foreground/60 text-primary-foreground')}>
				{row.getValue('status')}
			</Badge>
		),
		// size: 100,
		filterFn: statusFilterFn,
		enablePinning: true,
	},

	{
		header: 'Balance',
		accessorKey: 'balance',
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue('balance'));
			const formatted = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(amount);
			return formatted;
		},
		enablePinning: true,
		// size: 120,
	},
	{
		header: 'Performance',
		accessorKey: 'performance',
		enablePinning: true,
	},
];

export default function DataTableComponent() {
	const isClient = useIsClient();
	const { t, i18n } = useTranslation();
	const id = useId();

	const [data, setData] = useState<any[]>([]);
	const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [autoCollapseEnabled, setAutoCollapseEnabled] = useState(true);

	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	useEffect(() => {
		if (!isClient) return;

		let stored = localStorage.getItem('Visible-Columns');
		let visibleCols: VisibilityState = {};

		if (stored) {
			try {
				visibleCols = JSON.parse(stored);
			} catch {
				visibleCols = {};
			}
		}

		// fallback: if no stored data, assume all columns are hidden
		if (Object.keys(visibleCols).length === 0) {
			visibleCols = columns.reduce(
				(acc, col) => ({
					...acc,
					[col.id ?? (col as AccessorColumnDef<Item>).accessorKey!]: true,
				}),
				{}
			);
		}

		console.log('visibleCols (final): ', visibleCols);
		setColumnVisibility(visibleCols);
	}, [isClient, columns]);

	// save column visibility to localStorage on any change
	useEffect(() => {
		if (!isClient) return;
		localStorage.setItem('Visible-Columns', JSON.stringify(columnVisibility));
	}, [columnVisibility, isClient]);

	const tableRef = useRef(null!) as RefObject<HTMLDivElement>;
	const inputRef = useRef<HTMLInputElement>(null);

	const [sorting, setSorting] = useState<SortingState>([
		{
			id: (columns[0].header as string) || 'name',
			desc: false,
		},
	]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	// pinning columns
	const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: [], right: [] });
	useEffect(() => {
		const saved = localStorage.getItem('Column-Pinning');
		if (saved) setColumnPinning(JSON.parse(saved));
	}, []);

	const [globalFilter, setGlobalFilter] = useState<string>('');

	useEffect(() => {
		localStorage.setItem('Column-Pinning', JSON.stringify(columnPinning));
	}, [columnPinning]);

	function globalFilterFn(value: string) {
		setGlobalFilter(String(value).trim() || value);
	}

	const collapsingColumn = {
		id: 'expander',
		header: () => (
			<Button variant='ghost' size='icon' onClick={toggleExpandRowAll}>
				<ChevronRightIcon
					className={cn(
						'size-5 transform transition-all duration-300',
						expandedRows.size > 0 ? 'rotate-90' : 'rotate-0'
					)}
				/>
			</Button>
		),
		cell: ({ row }: { row: Row<Item> }) => (
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
		),
		enableSorting: false,
		enableHiding: false,
	};

	const mergedColumns = useMemo(() => {
		const base = [selectColumn, ...columns, ActionColumns];
		base.splice(base.length - 1, 0, collapsingColumn);

		return base;
	}, [selectColumn, columns, ActionColumns, collapsingColumn]);

	// table instance
	const table = useReactTable({
		data,
		columns: mergedColumns,
		state: {
			sorting,
			pagination,
			columnFilters,
			columnVisibility: columnVisibility,
			columnOrder,
			columnPinning,
			globalFilter,
		},
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getSortedRowModel: getSortedRowModel(), // sorting feature
		onSortingChange: setSorting, // sorting feature
		enableSortingRemoval: false,
		getPaginationRowModel: getPaginationRowModel(), // pagination feature
		onPaginationChange: setPagination, // pagination feature
		onColumnVisibilityChange: setColumnVisibility, // column visibility feature
		onColumnOrderChange: setColumnOrder, // column reordering drag and drop
		onColumnPinningChange: setColumnPinning, // pinning feature
		manualFiltering: true,
		debugTable: true,
	});

	// collapsing columns // arrange auto hidden columns based on current column order.
	type AccessorColumnDef<T> = ColumnDef<T> & { accessorKey: string };

	const measuredColumnIds = useMemo(() => {
		// tanstack exposes current ordered leaf columns via getAllLeafColumns() in display order
		return table.getAllLeafColumns().map((c) => c.id);
		// dependency: table.getState().columnOrder.join(',') يضمن إعادة الحساب عند تغيير الترتيب
	}, [table.getState().columnOrder.join(',')]);

	const { visibleCols, collapsedCols, setCollapsedCols, autoHiddenCols } = useAutoCollapseColumns(
		table,
		tableRef,
		['select', 'name', 'expander', 'actions'],
		columnVisibility,
		autoCollapseEnabled
	);

	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(visibleCols));

	const globalFilterFn2: any = table.getGlobalFilterFn();

	useEffect(() => {
		if (columnOrder.length === 0 && table.getAllLeafColumns().length > 0) {
			setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
		}
	}, [table.getAllLeafColumns()]);

	// status feature -----------------------------------------------------
	// Get unique status values
	const uniqueStatusValues = useMemo(() => {
		const statusColumn = table.getColumn('status');
		if (!statusColumn) return [];
		const values = Array.from(statusColumn.getFacetedUniqueValues().keys());
		return values.sort();
	}, [table.getColumn('status')?.getFacetedUniqueValues()]);

	// Get counts for each status
	const statusCounts = useMemo(() => {
		const statusColumn = table.getColumn('status');
		if (!statusColumn) return new Map();
		return statusColumn.getFacetedUniqueValues();
	}, [table.getColumn('status')?.getFacetedUniqueValues()]);

	const selectedStatuses = useMemo(() => {
		const filterValue = table.getColumn('status')?.getFilterValue() as string[];
		return filterValue ?? [];
	}, [table.getColumn('status')?.getFilterValue()]);

	const handleStatusChange = (checked: boolean, value: string) => {
		const filterValue = table.getColumn('status')?.getFilterValue() as string[];
		const newFilterValue = filterValue ? [...filterValue] : [];
		if (checked) {
			newFilterValue.push(value);
		} else {
			const index = newFilterValue.indexOf(value);
			if (index > -1) {
				newFilterValue.splice(index, 1);
			}
		}
		table.getColumn('status')?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
	};

	// expand feature ----------------------------------------
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

	// bulk actions --------------------------
	const handleDeleteRows = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		const updatedData = data.filter((item) => !selectedRows.some((row) => row.original.id === item.id));
		setData(updatedData);
		table.resetRowSelection();
	};

	// fetch dummy data
	useEffect(() => {
		fetch('https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/users-01_fertyx.json')
			.then((res) => res.json())
			.then((data) => setData(data));
	}, []);

	// drag & drop columns order feature -------------------------------------------------------
	// drag & drop sensors
	const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		// get current full order
		const current = table.getState().columnOrder.length
			? table.getState().columnOrder
			: table.getAllLeafColumns().map((c) => c.id);
		const oldIndex = current.indexOf(active.id as string);
		const newIndex = current.indexOf(over.id as string);
		if (oldIndex === -1 || newIndex === -1) return;

		const newOrder = arrayMove(current, oldIndex, newIndex);
		table.setColumnOrder(newOrder);
	}

	return (
		<div className='space-y-4 w-full'>
			{/* Filters */}
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex items-center flex-wrap gap-3'>
					{/* Filter by name or email */}
					<div className='relative'>
						<Input
							id={`${id}-input`}
							ref={inputRef}
							className={cn('peer min-w-60 ps-9', Boolean(table.getColumn('name')?.getFilterValue()) && 'pe-9')}
							value={(table.getColumn('name')?.getFilterValue() ?? '') as string}
							onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
							placeholder='Filter by name or email...'
							type='text'
							aria-label='Filter by name or email'
						/>
						<div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
							<ListFilterIcon size={16} aria-hidden='true' />
						</div>
						{Boolean(table.getColumn('name')?.getFilterValue()) && (
							<button
								className='text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
								aria-label='Clear filter'
								onClick={() => {
									table.getColumn('name')?.setFilterValue('');
									if (inputRef.current) {
										inputRef.current.focus();
									}
								}}
							>
								<CircleXIcon size={16} aria-hidden='true' />
							</button>
						)}
					</div>

					<div>
						<DebouncedInput
							value={globalFilter ?? ''}
							// onChange={(value) => setGlobalFilter(String(value))}
							onChange={(e) => table.setGlobalFilter(String(globalFilter))}
							className='p-2 font-lg shadow border border-block'
							placeholder='Search all columns...'
						/>
					</div>

					{/* Filter by status */}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant='outline'>
								<FilterIcon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
								Status
								{selectedStatuses.length > 0 && (
									<span className='bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium'>
										{selectedStatuses.length}
									</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-auto min-w-36 p-3' align='start'>
							<div className='space-y-3'>
								<div className='text-muted-foreground text-xs font-medium'>Filters</div>
								<div className='space-y-3'>
									{uniqueStatusValues.map((value, i) => (
										<div key={value} className='flex items-center gap-2'>
											<Checkbox
												id={`${id}-${i}`}
												checked={selectedStatuses.includes(value)}
												onCheckedChange={(checked: boolean) => handleStatusChange(checked, value)}
											/>
											<Label htmlFor={`${id}-${i}`} className='flex grow justify-between gap-2 font-normal'>
												{value}{' '}
												<span className='text-muted-foreground ms-2 text-xs'>{statusCounts.get(value)}</span>
											</Label>
										</div>
									))}
								</div>
							</div>
						</PopoverContent>
					</Popover>

					{/* Toggle columns visibility */}
					<ColumnVisibilityDropdown
						table={table}
						collapsedCols={collapsedCols} // ✅ get collapsed columns
						setCollapsedCols={setCollapsedCols} // ✅ update collapsed columns
						autoCollapseEnabled={autoCollapseEnabled}
						setAutoCollapseEnabled={setAutoCollapseEnabled} // ✅ user can enable/disable auto-collapse
					/>
				</div>

				{/* bulk actions */}
				<div className='flex items-center flex-wrap gap-3'>
					{/* Delete button */}
					{table.getSelectedRowModel().rows.length > 0 && (
						<div className='flex items-center gap-3'>
							{/* delete bulk  */}
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button className='ml-auto' variant='destructive'>
										<TrashIcon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
										{t('actions.delete')}
										<span className='bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium'>
											{table.getSelectedRowModel().rows.length}
										</span>
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<div className='flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4'>
										<div
											className='flex size-9 shrink-0 items-center justify-center rounded-full border'
											aria-hidden='true'
										>
											<CircleAlertIcon className='opacity-80' size={16} />
										</div>
										<AlertDialogHeader>
											<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently delete{' '}
												{table.getSelectedRowModel().rows.length} selected{' '}
												{table.getSelectedRowModel().rows.length === 1 ? 'row' : 'rows'}.
											</AlertDialogDescription>
										</AlertDialogHeader>
									</div>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleDeleteRows}>Delete</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>

							{/* duplicate bulk  */}
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button className='ml-auto' variant='secondary'>
										<CopyPlusIcon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
										Duplicate
										<span className='bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium'>
											{table.getSelectedRowModel().rows.length}
										</span>
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<div className='flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4'>
										<div
											className='flex size-9 shrink-0 items-center justify-center rounded-full border'
											aria-hidden='true'
										>
											<CircleAlertIcon className='opacity-80' size={16} />
										</div>
										<AlertDialogHeader>
											<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently delete{' '}
												{table.getSelectedRowModel().rows.length} selected{' '}
												{table.getSelectedRowModel().rows.length === 1 ? 'row' : 'rows'}.
											</AlertDialogDescription>
										</AlertDialogHeader>
									</div>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleDeleteRows}>Delete</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					)}
					{/* export bulk  */}
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button className='ml-auto' variant='outline'>
								<FileUpIcon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
								Export
								{table.getSelectedRowModel().rows.length > 0 ? (
									<span className='bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium'>
										{table.getSelectedRowModel().rows.length}
									</span>
								) : (
									' All'
								)}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<div className='flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4'>
								<div
									className='flex size-9 shrink-0 items-center justify-center rounded-full border'
									aria-hidden='true'
								>
									<CircleAlertIcon className='opacity-80' size={16} />
								</div>
								<AlertDialogHeader>
									<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This will permanently delete{' '}
										{table.getSelectedRowModel().rows.length} selected{' '}
										{table.getSelectedRowModel().rows.length === 1 ? 'row' : 'rows'}.
									</AlertDialogDescription>
								</AlertDialogHeader>
							</div>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={handleDeleteRows}>Delete</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					{/* {table.getSelectedRowModel().rows.length > 0 && (
							
						)} */}

					{/* Add user button */}
					{/* <Button className='ml-auto' variant='outline'>
						<PlusIcon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
						Add user
					</Button> */}
				</div>
			</div>

			{/* Table */}
			<div ref={tableRef} className='bg-background overflow-hidden rounded-md border w-full'>
				{isClient ? (
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
						<SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
							<TableComponent
								table={table}
								visibleCols={visibleCols}
								collapsedCols={collapsedCols}
								columnVisibility={columnVisibility}
								expandedRows={expandedRows}
								toggleExpandRow={toggleExpandRow}
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
						toggleExpandRow={toggleExpandRow}
					/>
				)}
			</div>

			{/* Pagination */}
			<div className='flex items-center justify-between flex-wrap gap-6'>
				{/* Results per page */}
				<div className='flex items-center gap-3'>
					<Label htmlFor={id} className='max-sm:sr-only'>
						{t('dataTable.rows_per_page')}
					</Label>
					<Select
						value={table.getState().pagination.pageSize.toString()}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger id={id} className='w-fit whitespace-nowrap'>
							<SelectValue placeholder='Select number of results' />
						</SelectTrigger>
						<SelectContent className='[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2'>
							{[5, 10, 25, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={pageSize.toString()}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{/* Page number information */}
				<div className='text-muted-foreground flex grow justify-end text-sm whitespace-nowrap'>
					<p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
						<span className='text-foreground'>
							{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
							{Math.min(
								Math.max(
									table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
										table.getState().pagination.pageSize,
									0
								),
								table.getRowCount()
							)}
						</span>{' '}
						of <span className='text-foreground'>{table.getRowCount().toString()}</span>
					</p>
				</div>

				{/* Pagination buttons */}
				<div className='mx-auto'>
					<Pagination>
						<PaginationContent>
							{/* First page button */}
							<PaginationItem>
								<Button
									size='icon'
									variant='outline'
									className='disabled:pointer-events-none disabled:opacity-50'
									onClick={() => table.firstPage()}
									disabled={!table.getCanPreviousPage()}
									aria-label='Go to first page'
								>
									<ChevronFirstIcon size={16} aria-hidden='true' />
								</Button>
							</PaginationItem>
							{/* Previous page button */}
							<PaginationItem>
								<Button
									size='icon'
									variant='outline'
									className='disabled:pointer-events-none disabled:opacity-50'
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
									aria-label='Go to previous page'
								>
									<ChevronLeftIcon size={16} aria-hidden='true' />
								</Button>
							</PaginationItem>
							{/* Next page button */}
							<PaginationItem>
								<Button
									size='icon'
									variant='outline'
									className='disabled:pointer-events-none disabled:opacity-50'
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
									aria-label='Go to next page'
								>
									<ChevronRightIcon size={16} aria-hidden='true' />
								</Button>
							</PaginationItem>
							{/* Last page button */}
							<PaginationItem>
								<Button
									size='icon'
									variant='outline'
									className='disabled:pointer-events-none disabled:opacity-50'
									onClick={() => table.lastPage()}
									disabled={!table.getCanNextPage()}
									aria-label='Go to last page'
								>
									<ChevronLastIcon size={16} aria-hidden='true' />
								</Button>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			</div>
		</div>
	);
}

export function togglePin(e: React.MouseEvent, column: ColumnType<Item, unknown>) {
	e.preventDefault();
	e.stopPropagation();
	if (column.getIsPinned()) {
		column.pin(false);
	} else {
		column.pin('left'); // ✅ فقط left
	}
}

function SortableColumnItem({ column }: { column: ColumnType<Item, unknown> }) {
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
				className='cursor-grab size-9 shrink-0 grid place-items-center opacity-50 hover:opacity-80 hover:[&>*]:scale-125 transition-all duration-300'
			>
				<GripVerticalIcon size={16} aria-label='grab' />
			</span>

			<DropdownMenuCheckboxItem
				checked={column.getIsVisible()}
				onCheckedChange={(checked) => column.toggleVisibility(checked as boolean)}
				onSelect={(e) => e.preventDefault()}
				className='hover:!bg-transparent grow justify-start'
			>
				<span className='capitalize'>{column.id}</span>
			</DropdownMenuCheckboxItem>

			{/* Pin toggle button */}
			<Button variant='ghost' size='icon' onClick={(e) => togglePin(e, column)}>
				{column.getIsPinned() ? (
					<PinOffIcon size={16} className='opacity-70 text-primary' />
				) : (
					<PinIcon size={16} className='opacity-70' />
				)}
			</Button>
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

	const allColumns = table.getAllLeafColumns();
	const hidableColumns = allColumns.filter((c) => c.getCanHide());

	const pinned = hidableColumns.filter((c) => c.getIsPinned());
	const unpinned = hidableColumns.filter((c) => !c.getIsPinned());

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = allColumns.findIndex((c) => c.id === active.id);
		const newIndex = allColumns.findIndex((c) => c.id === over.id);

		const newOrder = arrayMove(table.getState().columnOrder, oldIndex, newIndex);
		table.setColumnOrder(newOrder);

		// ✅ update collapsedCols after reordering
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
	}

	return (
		<DropdownMenu dir='rtl'>
			<DropdownMenuTrigger asChild>
				<Button variant='outline'>
					<Columns3Icon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
					{t('dataTable.columns')}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align='center' className='w-64'>
				<DropdownMenuLabel>{t('dataTable.manage_columns')}</DropdownMenuLabel>
				{/* Toggle AutoCollapse */}
				<span className='px-2 py-1 text-xs font-semibold text-muted-foreground'>
					{t('dataTable.collapse_or_scroll')}
				</span>
				<div className='flex items-center p-2'>
					{/* <Label htmlFor='Auto-Collapse'>{t('options.scroll')}</Label> */}
					<Label htmlFor='Auto-Collapse grow'>{t('options.auto_collapse')}</Label>
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

				<DropdownMenuSeparator className='bg-gray-400' />

				<DropdownMenuLabel>{t('dataTable.columns_control')}</DropdownMenuLabel>

				{/* ✅ أعمدة مثبتة أولاً */}
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
									className='hover:!bg-transparent'
								>
									<span className='capitalize'>{column.id}</span>
								</DropdownMenuCheckboxItem>

								<Button
									variant='ghost'
									size='icon'
									onClick={(e) => togglePin(e, column as unknown as columnType<Item>)}
								>
									<PinOffIcon size={16} className='opacity-70 text-primary' />
								</Button>
							</div>
						))}
						<DropdownMenuSeparator />
					</>
				)}
				{/* ✅ Draggable list for unpinned */}
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext items={unpinned.map((c) => c.id)} strategy={verticalListSortingStrategy}>
						{unpinned.map((column) => (
							<SortableColumnItem key={column.id} column={column as unknown as columnType<Item>} />
						))}
					</SortableContext>
				</DndContext>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function RowActions({ row }: { row: Row<Item> }) {
	return (
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
					<DropdownMenuItem>
						<span>Edit</span>
						<DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
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
				<DropdownMenuItem className='text-destructive focus:text-destructive'>
					<span>Delete</span>
					<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ✅ helpers
function getPinnedStyle(column: ColumnType<Item>): React.CSSProperties {
	if (!column.getIsPinned()) return {};

	const isLeft = column.getIsPinned() === 'left';
	const offset = column.getStart('left'); // tanstack يحسب offset تلقائياً px
	console.log('offset: ', offset);
	return {
		position: 'sticky',
		// [isLeft ? 'left' : 'right']: offset,
		// [dir]: offset,
		insetInlineStart: offset,
		zIndex: 2,
		// background: 'var(--background)', // أو bg-accent لو تحب
	};
}

function getOrderedHeaders(headerGroup: HeaderGroup<Item>) {
	const selectCol = headerGroup.headers.filter((h) => h.column.id === 'select');
	const pinnedLeft = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'left');
	const center = headerGroup.headers.filter(
		(h) => !['select', 'expander', 'actions'].includes(h.column.id) && !h.column.getIsPinned()
	);
	const pinnedRight = headerGroup.headers.filter((h) => h.column.getIsPinned() === 'right');
	const endCols = headerGroup.headers.filter((h) => ['expander', 'actions'].includes(h.column.id));

	return [...selectCol, ...pinnedLeft, ...center, ...pinnedRight, ...endCols];
}

function getOrderedCells(row: Row<Item>) {
	const cells = row.getAllCells();
	const selectCell = cells.filter((c) => c.column.id === 'select');
	const pinnedLeft = cells.filter((c) => c.column.getIsPinned() === 'left');
	const center = cells.filter((c) => !['select', 'expander', 'actions'].includes(c.column.id) && !c.column.getIsPinned());
	const pinnedRight = cells.filter((c) => c.column.getIsPinned() === 'right');
	const endCells = cells.filter((c) => ['expander', 'actions'].includes(c.column.id));

	return [...selectCell, ...pinnedLeft, ...center, ...pinnedRight, ...endCells];
}

// ✅ SortableHeader
export function SortableHeader({ header }: { header: HeaderType<Item, unknown> }) {
	const { i18n } = useTranslation();
	const pageDirection = i18n.dir();
	// const directionStart = pageDirection === 'ltr' ? 'left' : 'right';
	const directionStart = 'left';

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: header.column.id,
	});

	function handlePinning(e: React.MouseEvent, column: columnType<Item>) {
		e.preventDefault();
		e.stopPropagation();
		column.pin(column.getIsPinned() ? false : directionStart);
	}

	const style_all: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,

		...getPinnedStyle(header.column),
		// ...style,
	};

	const sortDirection = header.column.getIsSorted() as 'asc' | 'desc' | false;

	return (
		<TableHead
			key={header.id}
			data-colid={header.column.id}
			data-pinned={header.column.getIsPinned()}
			ref={setNodeRef}
			style={style_all}
			className='h-11 px-2 text-start'
		>
			{header.isPlaceholder ? null : header.column.getCanSort() ? (
				<div
					className={cn(
						'flex h-full items-center justify-between gap-2 select-none group hover:bg-muted/30 px-2',
						'cursor-pointer'
					)}
					onClick={header.column.getToggleSortingHandler()}
					tabIndex={0}
				>
					<p className='grow'>{flexRender(header.column.columnDef.header, header.getContext())}</p>

					{/* Sort icons */}
					{sortDirection === 'asc' ? (
						<AArrowUpIcon className='shrink-0 opacity-60 text-primary' size={20} />
					) : sortDirection === 'desc' ? (
						<AArrowDownIcon className='shrink-0 opacity-60 text-primary' size={20} />
					) : (
						<ArrowUpDownIcon className='shrink-0 opacity-60 group-hover:text-primary' size={16} />
					)}

					{/* pin button */}
					{header.column.getCanPin() && (
						<Button variant='ghost' size='icon' onClick={(e) => handlePinning(e, header.column)}>
							{header.column.getIsPinned() ? (
								<PinOffIcon className='shrink-0 opacity-60 group-hover:text-primary' size={16} />
							) : (
								<PinIcon className='shrink-0 opacity-60 group-hover:text-primary' size={16} />
							)}
						</Button>
					)}

					{/* drag handle */}
					<span
						{...attributes}
						{...listeners}
						className='cursor-grab h-full grid place-items-center opacity-50 hover:opacity-80 hover:[&>*]:scale-125 transition-all duration-300'
					>
						<GripVerticalIcon className='shrink-0' size={20} />
					</span>
				</div>
			) : (
				flexRender(header.column.columnDef.header, header.getContext())
			)}
		</TableHead>
	);
}

// ✅ MainRow
export function MainRow({ row, visibleCols, columnVisibility, collapsedCols, expandedRows, toggleExpandRow }: any) {
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
			className={cn('cursor-pointer hover:bg-muted/50', expandedRows.has(row.id) && 'bg-muted/40 border-b-0')}
			onClick={() => row.toggleSelected()}
		>
			{getOrderedCells(row)
				.filter((cell) => shouldShowColumn(cell.column.id))
				.map((cell) => (
					<TableCell key={cell.id} data-pinned={cell.column.getIsPinned()} style={getPinnedStyle(cell.column)}>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</TableCell>
				))}
		</TableRow>
	);
}

// ✅ ExpandedRow
export function ExpandedRow({ row, collapsedCols, columnVisibility, expandedRows, table }: any) {
	if (!expandedRows.has(row.id)) return null;
	const hasVisibleCollapsed = collapsedCols.some((id: string) => columnVisibility[id] !== false);
	if (!hasVisibleCollapsed) return null;

	return (
		<TableRow
			data-rowid={row.id}
			data-state={row.getIsSelected() && 'selected'}
			className={cn('expanded-row', expandedRows.has(row.id) && 'bg-muted/20')}
		>
			<TableCell colSpan={table.getVisibleLeafColumns().length + 1}>
				<div className='grid gap-2 sm:grid-cols-2 md:grid-cols-3 ps-9'>
					{collapsedCols
						.filter((colId: string) => columnVisibility[colId] !== false)
						.map((colId: string) => {
							const cell = row.getAllCells().find((c: Cell<Item, unknown>) => c.column.id === colId);
							const headerLabel = table.getColumn(colId)?.columnDef.header ?? colId;
							return (
								<div key={colId} className='flex items-center gap-2'>
									<span className='text-xs text-muted-foreground font-medium'>{headerLabel as string}</span>
									<span className='font-medium'>
										{cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : row.getValue(colId)}
									</span>
								</div>
							);
						})}
				</div>
			</TableCell>
		</TableRow>
	);
}

export function TableComponent({
	table,
	visibleCols,
	collapsedCols,
	columnVisibility,
	expandedRows,
	toggleExpandRow,
}: {
	table: TableType<Item>;
	visibleCols: string[];
	collapsedCols: string[];
	columnVisibility: VisibilityState;
	expandedRows: Set<string>;
	toggleExpandRow: (id: string) => void;
}) {
	const { t } = useTranslation();

	const [colOffsets, setColOffsets] = useState<Record<string, number>>({});

	// calculate pinned columns offsets
	useEffect(() => {
		const observer = new ResizeObserver(() => {
			const ths = document.querySelectorAll('th[data-colid]');
			const offsets: Record<string, number> = {};
			let left = 0;
			let right = 0;

			table.getAllLeafColumns().forEach((col: any) => {
				if (col.getIsPinned() === 'left') {
					offsets[col.id] = left;
					const el = document.querySelector(`th[data-colid="${col.id}"]`) as HTMLElement;
					if (el) left += el.offsetWidth;
				}
			});

			[...table.getAllLeafColumns()].reverse().forEach((col: any) => {
				if (col.getIsPinned() === 'right') {
					offsets[col.id] = right;
					const el = document.querySelector(`th[data-colid="${col.id}"]`) as HTMLElement;
					if (el) right += el.offsetWidth;
				}
			});

			console.log('table.getAllLeafColumns()', table.getAllLeafColumns());

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
					{table.getHeaderGroups().map((headerGroup: any) => (
						<TableRow key={headerGroup.id} className='bg-accent/70 hover:bg-accent/70'>
							{getOrderedHeaders(headerGroup)
								.filter((h) => shouldShowColumn(h.column.id, visibleCols, collapsedCols, columnVisibility))
								.map((h) => {
									const pinned = h.column.getIsPinned();
									const offset = pinned ? colOffsets[h.column.id] || 0 : 0;

									return <SortableHeader key={h.id} header={h} />;
								})}
						</TableRow>
					))}
				</TableHeader>

				{/* Body */}
				<TableBody>
					{table.getRowModel().rows.length ? (
						table.getRowModel().rows.map((row: any) => (
							<Fragment key={row.id}>
								<MainRow
									row={row}
									visibleCols={visibleCols}
									columnVisibility={columnVisibility}
									collapsedCols={collapsedCols}
									expandedRows={expandedRows}
									toggleExpandRow={toggleExpandRow}
									colOffsets={colOffsets}
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
									{t('dataTable.no_data')}
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}

'use client';
import {
	Cell,
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	ColumnPinningState,
	Column as columnType,
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

import DebouncedInput from '@/hooks/debouncedInput';
import useIsClient from '@/hooks/useIsClient';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import useAutoCollapseColumns from './useAutoCollapseColumns';

// A TanStack fork of Kent C. Dodds' match-sorter library that provides ranking information
// import { RankingInfo, rankItem } from '@tanstack/match-sorter-utils';

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
		enableHiding: false,
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

// const collapseExpandBtn = ({
// 	fn,
// 	isExpanded,
// 	type = 'row',
// 	t,
// }: {
// 	fn: () => void;
// 	isExpanded: boolean;
// 	type?: 'row' | 'col';
// 	t: TFunction;
// }): JSX.Element => (
// 	<TooltipProvider>
// 		<Tooltip>
// 			<TooltipTrigger asChild>
// 				<Button variant='link' onClick={fn} className='flex items-center text-sm'>
// 					<ChevronRightIcon className={cn('size-5 ', true ? 'rotate-90' : '')} />
// 				</Button>
// 			</TooltipTrigger>
// 			<TooltipContent>
// 				{type === 'row' ? (
// 					<p>
// 						{isExpanded ? t('dashboard.tooltips.collapse_columns') : t('dashboard.tooltips.show_collapsed_columns')}
// 					</p>
// 				) : (
// 					<p>{isExpanded ? t('dashboard.tooltips.collapse_all') : t('dashboard.tooltips.expand_all')}</p>
// 				)}
// 			</TooltipContent>
// 		</Tooltip>
// 	</TooltipProvider>
// );
export default function DataTableComponent() {
	const isClient = useIsClient();
	const { t, i18n } = useTranslation();

	const id = useId();

	const [data, setData] = useState<any[]>([]);

	const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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

	// collapsing columns // arrange auto hidden columns based on current column order.
	type AccessorColumnDef<T> = ColumnDef<T> & { accessorKey: string };

	const measuredColumnIds = useMemo(
		() => columns.map((c) => (c.id as string) ?? (c as AccessorColumnDef<Item>).accessorKey),
		[columns]
	);

	const { visibleCols, collapsedCols, autoHiddenCols } = useAutoCollapseColumns(
		tableRef,
		measuredColumnIds,
		// Object.keys(columnVisibility),
		[
			'select',
			(columns[0] as AccessorColumnDef<Item>).accessorKey, // 'name'
			'expander',
			'actions',
		],
		columnVisibility
		// Object.keys(columnVisibility) as string[]
	);

	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(visibleCols));

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

	const hasAutoCollapsedVisibleToUser = useMemo(() => {
		// توجد أعمدة مطوية آليًا والمستخدم لم يخفها يدوياً
		return Array.from(collapsedCols).some((id) => columnVisibility[id] !== false);
	}, [collapsedCols, columnVisibility]);

	const mergedColumns = useMemo(() => {
		const base = [selectColumn, ...columns, ActionColumns];

		if (hasAutoCollapsedVisibleToUser) {
			// نضيف عمود الطي قبل الأعمدة الأخيرة (قبل ActionColumns)
			base.splice(base.length - 1, 0, collapsingColumn);
		}

		return base;
	}, [selectColumn, columns, ActionColumns, collapsingColumn, hasAutoCollapsedVisibleToUser]);

	console.log('mergedColumns:', mergedColumns);

	function globalFilterFn(value: string) {
		setGlobalFilter(String(value).trim() || value);
	}

	// table instance
	const table = useReactTable({
		data,
		columns: mergedColumns,
		// globalFilterFn: globalFilterFn, // built-in filter function
		// globalFilterFn: 'fuzzy', //apply fuzzy filter to the global filter (most common use case for fuzzy filter)

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

	const globalFilterFn2: any = table.getGlobalFilterFn();
	// globalFilter && globalFilterFn && globallyFilterableColumns.length;
	// useEffect(() => {
	// 	// code
	// 	table.setColumnPinning({
	// 		left: ['select'], // يثبت عمود select على اليسار
	// 		right: ['actions', 'expander'], // يثبت عمود actions على اليمين
	// 	});
	// }, []);

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

	// handle column reorder
	function handleDragEnd(event: any) {
		const { active, over } = event;
		if (active.id !== over?.id) {
			setColumnOrder((cols) => {
				const oldIndex = cols.indexOf(active.id);
				const newIndex = cols.indexOf(over.id);
				return arrayMove(cols, oldIndex, newIndex);
			});
		}
	}

	// const TableComponent = (
	// 	<div className='table-container overflow-x-hidden w-full'>
	// 		<Table className='table-auto w-full'>
	// 			{/* Header */}
	// 			<TableHeader>
	// 				{table.getHeaderGroups().map((headerGroup) => (
	// 					<TableRow key={headerGroup.id} className='bg-accent/70 hover:bg-accent/70'>
	// 						{headerGroup.headers
	// 							.filter((header) => {
	// 								const id = header.column.id;

	// 								// ✅ the basic columns are always present
	// 								if (['select', 'actions'].includes(id)) return true;

	// 								// ✅ expander يظهر فقط إذا فيه أعمدة مطوية والمستخدم ما أخفاها
	// 								if (id === 'expander' && collapsedCols.length > 0) {
	// 									return collapsedCols.some((colId) => columnVisibility[colId] !== false);
	// 								}

	// 								// ✅ another column: that must be visible in the system if not hidden by the user
	// 								const isUserVisible = columnVisibility[id] !== false;
	// 								const isSystemVisible = visibleCols.length > 0 ? visibleCols.includes(id) : true; // fallback

	// 								return isUserVisible && isSystemVisible;
	// 							})
	// 							.map((header) => (
	// 								<SortableHeader key={header.id} header={header} />
	// 							))}
	// 					</TableRow>
	// 				))}
	// 			</TableHeader>

	// 			{/* Body */}
	// 			<TableBody>
	// 				{table.getRowModel().rows.length ? (
	// 					table.getRowModel().rows.map((row) => (
	// 						<Fragment key={row.id}>
	// 							{/* main row*/}
	// 							<TableRow
	// 								data-rowid={row.id}
	// 								data-state={row.getIsSelected() && 'selected'}
	// 								className={cn(
	// 									'cursor-pointer hover:bg-muted/50',
	// 									`peer-${row.id}`,
	// 									expandedRows.has(row.id) && 'bg-muted/40xxx border-b-0'
	// 								)}
	// 								onClick={() => row.toggleSelected()}
	// 								onMouseEnter={() =>
	// 									document
	// 										.querySelectorAll(`[data-rowid='${row.id}']`)
	// 										.forEach((el) => el.classList.add('bg-muted/50'))
	// 								}
	// 								onMouseLeave={() =>
	// 									document
	// 										.querySelectorAll(`[data-rowid='${row.id}']`)
	// 										.forEach((el) => el.classList.remove('bg-muted/50'))
	// 								}
	// 							>
	// 								{row
	// 									.getAllCells()
	// 									.filter((cell) => {
	// 										const id = cell.column.id;

	// 										// basic columns
	// 										if (['select', 'actions'].includes(id)) return true;
	// 										if (id === 'expander' && collapsedCols.length > 0) return true;

	// 										// another column: that must be visible in the system if not hidden by the user
	// 										return visibleCols.includes(id) && columnVisibility[id] !== false;
	// 									})
	// 									.map((cell) => (
	// 										<TableCell key={cell.id}>
	// 											{flexRender(cell.column.columnDef.cell, cell.getContext())}
	// 										</TableCell>
	// 									))}
	// 							</TableRow>

	// 							{/* collapsed row */}
	// 							{expandedRows.has(row.id) && collapsedCols.some((id) => columnVisibility[id] !== false) && (
	// 								<TableRow
	// 									data-rowid={row.id}
	// 									onClick={() => row.toggleSelected()}
	// 									className={cn('expanded-row ', `peer-${row.id}-data-[state=selected]:bg-muted`)}
	// 									onMouseEnter={() =>
	// 										document
	// 											.querySelectorAll(`[data-rowid='${row.id}']`)
	// 											.forEach((el) => el.classList.add('bg-muted/50'))
	// 									}
	// 									onMouseLeave={() =>
	// 										document
	// 											.querySelectorAll(`[data-rowid='${row.id}']`)
	// 											.forEach((el) => el.classList.remove('bg-muted/50'))
	// 									}
	// 								>
	// 									<TableCell colSpan={table.getVisibleLeafColumns().length + 1}>
	// 										<div className='grid gap-2 sm:grid-cols-2 md:grid-cols-3 ps-9'>
	// 											{collapsedCols
	// 												.filter((colId) => columnVisibility[colId] !== false)
	// 												.map((colId) => {
	// 													const cell = row.getAllCells().find((c) => c.column.id === colId);
	// 													const headerLabel = table.getColumn(colId)?.columnDef.header ?? colId;

	// 													return (
	// 														<div key={colId} className='flex items-center gap-2'>
	// 															<span className='text-xs text-muted-foreground font-medium'>
	// 																{headerLabel as string}
	// 															</span>
	// 															<span className='font-medium'>
	// 																{cell
	// 																	? flexRender(cell.column.columnDef.cell, cell.getContext())
	// 																	: row.getValue(colId)}
	// 															</span>
	// 														</div>
	// 													);
	// 												})}
	// 										</div>
	// 									</TableCell>
	// 								</TableRow>
	// 							)}
	// 						</Fragment>
	// 					))
	// 				) : (
	// 					<TableRow>
	// 						<TableCell colSpan={columns.length + 1} className='h-24 text-center'>
	// 							{t('dataTable.no_data')}
	// 						</TableCell>
	// 					</TableRow>
	// 				)}
	// 			</TableBody>
	// 		</Table>
	// 	</div>
	// );

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
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline'>
								<Columns3Icon className='-ms-1 opacity-60' size={16} aria-hidden='true' />
								View
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className='capitalize'
											checked={column.getIsVisible()}
											onCheckedChange={(value) => column.toggleVisibility(!!value)}
											onSelect={(event) => event.preventDefault()}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
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
										Delete
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
						Rows per page
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

// function SortableHeader({ header }: { header: any }) {
// 	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: header.column.id });

// 	const style: React.CSSProperties = {
// 		transform: CSS.Transform.toString(transform),
// 		transition,
// 		opacity: isDragging ? 0.5 : 1,
// 	};

// 	const sortDirection = header.column.getIsSorted() as 'asc' | 'desc' | false;

// 	return (
// 		<TableHead
// 			key={header.id}
// 			data-colid={header.column.id}
// 			ref={setNodeRef}
// 			style={style}
// 			className='h-11 px-2 text-start'
// 		>
// 			{header.isPlaceholder ? null : header.column.getCanSort() ? (
// 				<div
// 					className={cn(
// 						'flex h-full items-center justify-between gap-2 select-none group hover:bg-muted/30 px-2',
// 						'cursor-pointer'
// 					)}
// 					onClick={header.column.getToggleSortingHandler()}
// 					onKeyDown={(e) => {
// 						if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
// 							e.preventDefault();
// 							header.column.getToggleSortingHandler()?.(e);
// 						}
// 					}}
// 					tabIndex={0}
// 				>
// 					{/* Header content */}
// 					<p className='grow'>{flexRender(header.column.columnDef.header, header.getContext())}</p>

// 					{/* Sorting icons */}
// 					{sortDirection === 'asc' ? (
// 						<AArrowUpIcon className='shrink-0 opacity-60 text-primary' size={20} />
// 					) : sortDirection === 'desc' ? (
// 						<AArrowDownIcon className='shrink-0 opacity-60 text-primary' size={20} />
// 					) : (
// 						<ArrowUpDownIcon className='shrink-0 opacity-60 group-hover:text-primary' size={16} />
// 					)}

// 					{/* Drag handle (only this is draggable) */}
// 					<span {...attributes} {...listeners} className='cursor-grab h-full grid place-items-center'>
// 						<GripVerticalIcon className='shrink-0 opacity-60' size={20} aria-hidden='true' />
// 					</span>
// 				</div>
// 			) : (
// 				flexRender(header.column.columnDef.header, header.getContext())
// 			)}
// 		</TableHead>
// 	);
// }

export function SortableHeader({ header, style }: { header: HeaderType<Item, unknown>; style?: React.CSSProperties }) {
	const { t, i18n } = useTranslation();
	const pageDirection = i18n.dir();
	console.log('direction:', pageDirection);

	// const [directionStart, setDirectionStart] = useState<'left' | 'right'>(pageDirection === 'ltr' ? 'left' : 'right');
	const [directionStart, setDirectionStart] = useState<'left' | 'right'>('left');

	// const directionStart = pageDirection === 'ltr' ? 'left' : 'right';
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: header.column.id,
	});

	function handlePinning(e: React.MouseEvent, column: columnType<Item>) {
		e.preventDefault();
		e.stopPropagation();
		column.pin(header.column.getIsPinned() ? false : directionStart);
	}

	const style_all: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		...style,
	};

	const sortDirection = header.column.getIsSorted() as 'asc' | 'desc' | false;

	return (
		<TableHead
			key={header.id}
			data-colid={header.column.id}
			data-pinned={header.column.getIsPinned()} // ✅ pinning attribute
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
					onKeyDown={(e) => {
						if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
							e.preventDefault();
							header.column.getToggleSortingHandler()?.(e);
						}
					}}
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

					{/* pin icon */}
					{header.column.getCanPin() && (
						<Button variant='ghost' size='icon' onClick={(e) => handlePinning(e, header.column)}>
							{header.column.getIsPinned() ? (
								<PinOffIcon className='shrink-0 opacity-60 group-hover:text-primary' size={16} />
							) : (
								<PinIcon className='shrink-0 opacity-60 group-hover:text-primary' size={16} />
							)}
						</Button>
					)}

					{/* Drag handle */}
					<span {...attributes} {...listeners} className='cursor-grab h-full grid place-items-center'>
						<GripVerticalIcon className='shrink-0 opacity-60' size={20} aria-hidden='true' />
					</span>
				</div>
			) : (
				flexRender(header.column.columnDef.header, header.getContext())
			)}
		</TableHead>
	);
}

// export function MainRow({ row, visibleCols, columnVisibility, collapsedCols, expandedRows, toggleExpandRow }: any) {
// 	return (
// 		<TableRow
// 			data-rowid={row.id}
// 			data-state={row.getIsSelected() && 'selected'}
// 			className={cn('cursor-pointer hover:bg-muted/50', expandedRows.has(row.id) && 'bg-muted/40 border-b-0')}
// 			onClick={() => row.toggleSelected()}
// 		>
// 			{row
// 				.getAllCells()
// 				.filter((cell: Cell<Item, unknown>) => {
// 					const id = cell.column.id;

// 					if (['select', 'actions'].includes(id)) return true;
// 					if (id === 'expander' && collapsedCols.length > 0) return true;

// 					return visibleCols.includes(id) && columnVisibility[id] !== false;
// 				})
// 				.map((cell: Cell<Item, unknown>) => (
// 					<TableCell
// 						key={cell.id}
// 						data-pinned={cell.column.getIsPinned()} // ✅ pin attribute
// 					>
// 						{flexRender(cell.column.columnDef.cell, cell.getContext())}
// 					</TableCell>
// 				))}
// 		</TableRow>
// 	);
// }

// export function ExpandedRow({ row, collapsedCols, columnVisibility, expandedRows, table }: any) {
// 	if (!expandedRows.has(row.id)) return null;

// 	const hasVisibleCollapsed = collapsedCols.some((id: string) => columnVisibility[id] !== false);
// 	if (!hasVisibleCollapsed) return null;

// 	return (
// 		<TableRow data-rowid={row.id} className='expanded-row'>
// 			<TableCell colSpan={table.getVisibleLeafColumns().length + 1}>
// 				<div className='grid gap-2 sm:grid-cols-2 md:grid-cols-3 ps-9'>
// 					{collapsedCols
// 						.filter((colId: string) => columnVisibility[colId] !== false)
// 						.map((colId: string) => {
// 							const cell = row.getAllCells().find((c: Cell<Item, unknown>) => c.column.id === colId);
// 							const headerLabel = table.getColumn(colId)?.columnDef.header ?? colId;

// 							return (
// 								<div key={colId} className='flex items-center gap-2'>
// 									<span className='text-xs text-muted-foreground font-medium'>{headerLabel as string}</span>
// 									<span className='font-medium'>
// 										{cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : row.getValue(colId)}
// 									</span>
// 								</div>
// 							);
// 						})}
// 				</div>
// 			</TableCell>
// 		</TableRow>
// 	);
// }

function shouldShowColumn(id: string, visibleCols: string[], collapsedCols: string[], columnVisibility: any) {
	if (['select', 'actions'].includes(id)) return true;
	if (id === 'expander' && collapsedCols.length > 0) {
		return collapsedCols.some((colId) => columnVisibility[colId] !== false);
	}
	return columnVisibility[id] !== false && visibleCols.includes(id);
}

export function MainRow({ row, visibleCols, columnVisibility, collapsedCols, expandedRows, colOffsets }: any) {
	return (
		<TableRow
			data-rowid={row.id}
			data-state={row.getIsSelected() && 'selected'}
			className={cn('cursor-pointer hover:bg-muted/50', expandedRows.has(row.id) && 'bg-muted/40 border-b-0')}
			onClick={() => row.toggleSelected()}
		>
			{row
				.getAllCells()
				.filter((cell: Cell<any, unknown>) =>
					shouldShowColumn(cell.column.id, visibleCols, collapsedCols, columnVisibility)
				)
				.map((cell: Cell<any, unknown>) => {
					const pinned = cell.column.getIsPinned();
					const offset = pinned ? colOffsets[cell.column.id] || 0 : 0;

					return (
						<TableCell
							key={cell.id}
							data-pinned={pinned || false}
							style={
								pinned
									? {
											position: 'sticky',
											left: cell.column.getIsPinned() === 'left' ? offset : undefined,
											right: cell.column.getIsPinned() === 'right' ? offset : undefined,
											zIndex: 20,
											background: 'var(--background)',
									  }
									: {}
							}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</TableCell>
					);
				})}
		</TableRow>
	);
}

export function ExpandedRow({ row, collapsedCols, columnVisibility, expandedRows, table }: any) {
	if (!expandedRows.has(row.id)) return null;
	const hasVisibleCollapsed = collapsedCols.some((id: string) => columnVisibility[id] !== false);
	if (!hasVisibleCollapsed) return null;

	return (
		<TableRow data-rowid={row.id} className='expanded-row'>
			<TableCell colSpan={table.getVisibleLeafColumns().length + 1}>
				<div className='grid gap-2 sm:grid-cols-2 md:grid-cols-3 ps-9'>
					{collapsedCols
						.filter((colId: string) => columnVisibility[colId] !== false)
						.map((colId: string) => {
							const cell = row.getAllCells().find((c: Cell<any, unknown>) => c.column.id === colId);
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

// export function TableComponent({
// 	table,
// 	visibleCols,
// 	collapsedCols,
// 	columnVisibility,
// 	expandedRows,
// 	toggleExpandRow,
// }: {
// 	table: TableType<Item>;
// 	visibleCols: string[];
// 	collapsedCols: string[];
// 	columnVisibility: VisibilityState; // : { [key: string]: boolean };
// 	expandedRows: Set<string>;
// 	toggleExpandRow: (id: string) => void;
// }) {
// 	const { t } = useTranslation();

// 	const headerGroupFns: Record<string, () => HeaderGroup<Item>[]> = {
// 		left: table.getLeftHeaderGroups,
// 		center: table.getCenterHeaderGroups,
// 		right: table.getRightHeaderGroups,
// 	};

// 	function shouldShowColumn(id: string, visibleCols: string[], collapsedCols: string[], columnVisibility: VisibilityState) {
// 		if (['select', 'actions'].includes(id)) return true;
// 		if (id === 'expander' && collapsedCols.length > 0) {
// 			return collapsedCols.some((colId) => columnVisibility[colId] !== false);
// 		}
// 		return columnVisibility[id] !== false && visibleCols.includes(id);
// 	}

// 	return (
// 		<div className='table-container overflow-x-hidden w-full'>
// 			<Table className='table-auto w-full'>
// 				{/* Header */}
// 				<TableHeader>
// 					{(['left', 'center', 'right'] as const).map((pos) =>
// 						headerGroupFns[pos]().map((headerGroup) => (
// 							<TableRow key={headerGroup.id} className='bg-accent/70 hover:bg-accent/70'>
// 								{headerGroup.headers
// 									.filter((h) => shouldShowColumn(h.column.id, visibleCols, collapsedCols, columnVisibility))
// 									.map((h) => (
// 										<SortableHeader key={h.id} header={h} />
// 									))}
// 							</TableRow>
// 						))
// 					)}
// 				</TableHeader>

// 				{/* Body */}
// 				<TableBody>
// 					{table.getRowModel().rows.length ? (
// 						table.getRowModel().rows.map((row: any) => (
// 							<Fragment key={row.id}>
// 								<MainRow
// 									row={row}
// 									visibleCols={visibleCols}
// 									columnVisibility={columnVisibility}
// 									collapsedCols={collapsedCols}
// 									expandedRows={expandedRows}
// 									toggleExpandRow={toggleExpandRow}
// 								/>
// 								<ExpandedRow
// 									row={row}
// 									collapsedCols={collapsedCols}
// 									columnVisibility={columnVisibility}
// 									expandedRows={expandedRows}
// 									table={table}
// 								/>
// 							</Fragment>
// 						))
// 					) : (
// 						<TableRow>
// 							<td colSpan={visibleCols.length + 1} className='h-24 text-center'>
// 								{t('dataTable.no_data')}
// 							</td>
// 						</TableRow>
// 					)}
// 				</TableBody>
// 			</Table>
// 		</div>
// 	);
// }

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

	// حساب إزاحات الأعمدة المثبتة
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

	function getOrderedHeaders(headerGroup: HeaderGroup<Item>) {
		const selectCol = headerGroup.headers.filter((h) => h.column.id === 'select');

		const pinned = table
			.getLeftHeaderGroups()
			.flatMap((hg) => hg.headers)
			.filter((h) => !['select', 'expander', 'actions'].includes(h.column.id));

		// const center = headerGroup.headers.filter((h) => !['select', 'expander', 'actions'].includes(h.column.id));
		const center = headerGroup.headers.filter(
			(h) => !['select', 'expander', 'actions', ...pinned.map((h) => h.column.id)].includes(h.column.id)
		);
		const EndCols = headerGroup.headers.filter((h) => ['expander', 'actions'].includes(h.column.id));

		const allCols = new Set([...selectCol, ...pinned, ...center, ...EndCols]);

		return Array.from(allCols);
	}

	function getOrderedCells(row: Row<Item>) {
		const cells = row.getAllCells();
		const selectCell = cells.filter((h) => h.column.id === 'select');
		const pinnedLeft = cells.filter((c) => c.column.getIsPinned() === 'left');
		const center = cells.filter(
			(c) => !['select', 'expander', 'actions'].includes(c.column.id) && !c.column.getIsPinned()
		);
		console.log('center cell: ', center);
		const EndCols = cells.filter((h) => ['expander', 'actions'].includes(h.column.id));

		const allCols = new Set([...selectCell, ...pinnedLeft, ...center, ...EndCols]);

		return Array.from(allCols);
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

									return (
										<SortableHeader
											key={h.id}
											header={h}
											style={
												pinned ? {
													position: 'sticky',
													left: h.column.getIsPinned() === 'left' ? offset : undefined,
													right: h.column.getIsPinned() === 'right' ? offset : undefined,
													zIndex: 30,
													background: 'var(--background)',
												} : {}
											}
										/>
									);
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
							<td colSpan={visibleCols.length + 1} className='h-24 text-center'>
								{t('dataTable.no_data')}
							</td>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}

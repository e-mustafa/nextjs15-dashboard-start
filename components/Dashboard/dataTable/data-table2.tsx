'use client';

import {
	ColumnDef,
	ColumnFiltersState,
	FilterFn,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	Header,
	PaginationState,
	Row,
	SortingState,
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
	TrashIcon,
} from 'lucide-react';
import { Fragment, JSX, RefObject, useEffect, useId, useMemo, useRef, useState } from 'react';

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

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useIsClient from '@/hooks/useIsClient';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Table as TanTable } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import useResponsiveColumns from './seResponsiveColumns';
// import { useResponsiveColumns } from './seResponsiveColumns';

export type Item = {
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

const columns: ColumnDef<Item>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				className='bg-background border-primary ms-2'
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => (
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
	},
	{
		header: 'Name',
		accessorKey: 'name',
		cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>,
		size: 180,
		filterFn: multiColumnFilterFn,
		enableHiding: false,
	},
	{
		header: 'Email',
		accessorKey: 'email',
		size: 220,
	},
	{
		header: 'Location',
		accessorKey: 'location',
		cell: ({ row }) => (
			<div>
				<span className='text-lg leading-none'>{row.original.flag}</span> {row.getValue('location')}
			</div>
		),
		size: 180,
	},
	{
		header: 'Status',
		accessorKey: 'status',
		cell: ({ row }) => (
			<Badge className={cn(row.getValue('status') === 'Inactive' && 'bg-muted-foreground/60 text-primary-foreground')}>
				{row.getValue('status')}
			</Badge>
		),
		size: 100,
		filterFn: statusFilterFn,
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
		size: 120,
	},
	{
		header: 'Performance',
		accessorKey: 'performance',
	},

	{
		id: 'expander',
		header: ({ table }) =>
			table.getRowModel().rows.some((r) => r.getCanExpand())
				? collapseExpandBtn(table.getToggleAllRowsExpandedHandler(), table.getIsAllRowsExpanded(), 'col')
				: null,
		cell: ({ row }) =>
			row.getCanExpand() ? (
				<button onClick={row.getToggleExpandedHandler()}>{row.getIsExpanded() ? '−' : '+'}</button>
			) : null,
		size: 40,
		enableSorting: false,
		enableHiding: false,
	},

	{
		id: 'actions',
		header: () => <span className='sr-only'>Actions</span>,
		cell: ({ row }) => <RowActions row={row} />,
		size: 60,
		enableHiding: false,
	},
];

const collapseExpandBtn = (
	fn: (...args: any[]) => void,
	isExpanded: boolean,
	type: 'row' | 'col' = 'row'
	// t: TFunction
): JSX.Element => (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant='link' onClick={fn} className='flex items-center text-sm'>
					<ChevronRightIcon className={cn('size-5 ', true ? 'rotate-90' : '')} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{/* {type === 'row' ? (
					<p>
						{isExpanded ? t('tooltips.collapse_columns') : t('tooltips.show_collapsed_columns')}
					</p>
				) : (
					<p>{isExpanded ? t('tooltips.collapse_all') : t('tooltips.expand_all')}</p>
				)} */}
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
);

export default function DataTableComponent() {
	const isClient = useIsClient();
	const { t } = useTranslation();
	const id = useId();
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const inputRef = useRef<HTMLInputElement>(null);

	const [sorting, setSorting] = useState<SortingState>(
		columns[2].id ? [{ id: columns[2].id, desc: false }] : []
		// [{
		// 	id: 'name',
		// 	desc: false,
		// }]
	);

	// ------------------------

	// const initialOrder = columns.map((c) => c.id ?? (c.accessorKey as string));
	const initialOrder = columns.map((c) => {
		if ('id' in c && c.id) return c.id;
		if ('accessorKey' in c && c.accessorKey) return c.accessorKey.toString();
		throw new Error('Column must have either id or accessorKey');
	});

	const [columnOrder, setColumnOrder] = useState<string[]>(initialOrder);

	const [data, setData] = useState<Item[]>([]);
	useEffect(() => {
		async function fetchPosts() {
			const res = await fetch(
				'https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/users-01_fertyx.json'
			);
			const data = await res.json();
			setData(data);
		}
		fetchPosts();
	}, []);

	const handleDeleteRows = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		const updatedData = data.filter((item) => !selectedRows.some((row) => row.original.id === item.id));
		setData(updatedData);
		table.resetRowSelection();
	};

	// const tableRef = useRef(null) as unknown as RefObject<HTMLDivElement>;
	// const tableRef = useRef<HTMLDivElement>(null!);
	const tableRef = useRef<TanTable<Item>>(null!);
	type AccessorColumnDef<T> = ColumnDef<T> & { accessorKey: string };

	// Hook call to get visible and collapsed columns based on table width
	// const { collapsedCols } = useResponsiveColumns(
	// 	tableRef,
	// 	columns.map((c) => (c.id as string) ?? (c as AccessorColumnDef<Item>).accessorKey)
	// );

	const { visibleCols, collapsedCols } = useResponsiveColumns(
		tableRef as unknown as TanTable<Item>,
		// columns.map((c) => (c.id as string) ?? (c as AccessorColumnDef<Item>).accessorKey),
		columns.map((c) => ({ id: c.id ?? (c as AccessorColumnDef<Item>).accessorKey })),
		['select', 'name', 'email', 'location', 'actions'] // ← الأعمدة الافتراضية اللي تبيها
	);

	// const { collapsedCols, visibleCols } = useResponsiveColumns(
	// 	table,
	// 	columns,
	// 	['col1', 'col2', 'col3'] // ← الأعمدة الافتراضية اللي تبيها
	// );

	// console.log('visibleCols: ', visibleCols, 'collapsedCols: ', collapsedCols);

	// state for column visibility
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

	// useEffect(() => {
	// 	if (typeof window === 'undefined') return;

	// 	const newVisibility: VisibilityState = {};
	// 	columns.forEach((col) => {
	// 		if ((col as AccessorColumnDef<Item>).accessorKey) {
	// 			const id = col.id ?? (col as AccessorColumnDef<Item>).accessorKey;
	// 			newVisibility[id] = visibleCols.includes(id);
	// 		}
	// 	});

	// 	// compare old and new visibility states to avoid infinite loop
	// 	setColumnVisibility((prev) => {
	// 		const same =
	// 			Object.keys(prev).length === Object.keys(newVisibility).length &&
	// 			Object.entries(newVisibility).every(([k, v]) => prev[k] === v);

	// 		// if same then no need to update state
	// 		return same ? prev : newVisibility;
	// 	});
	// }, [visibleCols]);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		setColumnVisibility((prev) => {
			const newVisibility: VisibilityState = { ...prev };

			columns.forEach((col) => {
				const id = col.id ?? (col as AccessorColumnDef<Item>).accessorKey;
				if (!(id in newVisibility)) {
					newVisibility[id] = visibleCols.includes(id);
				}
			});

			return newVisibility;
		});
	}, [columns, visibleCols]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		enableSortingRemoval: false,
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		onColumnFiltersChange: setColumnFilters,
		// onColumnVisibilityChange: setUserColumnVisibility, // setColumnVisibility,
		onColumnVisibilityChange: setColumnVisibility,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		onColumnOrderChange: setColumnOrder, // New
		// onExpandedChange: setExpandedRows,
		getExpandedRowModel: getExpandedRowModel(), // مهم
		state: {
			sorting,
			pagination,
			columnFilters,
			columnVisibility,
			columnOrder,
			// columnVisibility: mergedVisibility,
		},
		// onColumnVisibilityChange: setColumnVisibility,
	});

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

	// dragable headers
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (active.id !== over?.id) {
			setColumnOrder((items) => {
				const oldIndex = items.indexOf(active.id as string);
				const newIndex = items.indexOf(over?.id as string);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	}

	// collapsing columns
	// arrange auto hidden columns based on current column order
	// const hiddenColsOrdered = columnOrder.filter((id) => autoHiddenCols.has(id));

	// function toggleExpandRowAll() {
	// 	setExpandedRows((prev) => {
	// 		if (prev.size === table.getRowCount()) {
	// 			return new Set();
	// 		} else {
	// 			return new Set(table.getRowModel().rows.map((row) => row.id));
	// 		}
	// 	});
	// }

	<style jsx>{`
		tr[data-rowid]:hover,
		tr[data-rowid]:hover + tr.expanded-row {
			background-color: var(--muted);
		}
		tr.expanded-row:hover,
		tr.expanded-row:hover ~ tr[data-rowid] {
			background-color: var(--muted);
		}
	`}</style>;

	const TableComponent = (
		<Table className='table-auto'>
			{/* Header */}
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id} className='bg-accent/70 hover:bg-accent/70'>
						{headerGroup.headers.map((header) => (
							<SortableHeader key={header.id} header={header} />
						))}
					</TableRow>
				))}
			</TableHeader>

			{/* Body */}
			<TableBody>
				{table.getRowModel().rows.length ? (
					table.getRowModel().rows.map((row) => (
						<Fragment key={row.id}>
							{/* main row*/}
							<TableRow
								data-rowid={row.id}
								data-state={row.getIsSelected() && 'selected'}
								className={cn('cursor-pointer hover:bg-muted/50', row.getIsExpanded() && 'bg-muted/40')}
								onClick={() => row.toggleSelected()}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
								))}
							</TableRow>

							{/* expanded row */}
							{row.getIsExpanded() && collapsedCols.length > 0 && (
								<TableRow data-rowid={row.id} className='expanded-row'>
									<TableCell colSpan={table.getVisibleLeafColumns().length + 1}>
										<div className='grid gap-2 sm:grid-cols-2 md:grid-cols-3'>
											{collapsedCols
												.filter((colId: string) => table.getColumn(colId)?.getIsVisible())
												.map((colId: string) => {
													const cell = row.getAllCells().find((c) => c.column.id === colId);
													const headerLabel = table.getColumn(colId)?.columnDef.header ?? colId;
													return (
														<div key={colId} className='flex justify-between'>
															<span className='text-xs text-muted-foreground'>{headerLabel as string}</span>
															<span className='font-medium'>
																{cell
																	? flexRender(cell.column.columnDef.cell, cell.getContext())
																	: row.getValue(colId)}
															</span>
														</div>
													);
												})}
										</div>
									</TableCell>
								</TableRow>
							)}
						</Fragment>
					))
				) : (
					<TableRow>
						<TableCell colSpan={columns.length + 1} className='h-24 text-center'>
							{t('dataTable.no_data')}
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);

	return (
		<div className='space-y-4 w-full'>
			{/* Filters */}
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex items-center gap-3'>
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
				<div className='flex items-center gap-3'>
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
			<div
				ref={tableRef as unknown as RefObject<HTMLDivElement>}
				className='bg-background overflow-hiddenxxx rounded-md border w-full'
			>
				{isClient ? (
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
						<SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
							{TableComponent}
						</SortableContext>
					</DndContext>
				) : (
					TableComponent
				)}
			</div>

			{/* Pagination */}
			<div className='flex items-center justify-between gap-8'>
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
				<div>
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

function SortableHeader({ header }: { header: Header<Item, unknown> }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: header.column.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const sortDirection = header.column.getIsSorted() as 'asc' | 'desc' | false;

	return (
		<TableHead key={header.id} ref={setNodeRef} style={style} className='h-11 px-2 text-start'>
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
					{/* Header content */}
					<p className='grow'>{flexRender(header.column.columnDef.header, header.getContext())}</p>

					{/* Sorting icons */}
					{sortDirection === 'asc' ? (
						<AArrowUpIcon className='shrink-0 opacity-60 text-primary' size={20} />
					) : sortDirection === 'desc' ? (
						<AArrowDownIcon className='shrink-0 opacity-60 text-primary' size={20} />
					) : (
						<ArrowUpDownIcon className='shrink-0 opacity-60 group-hover:text-primary' size={16} />
					)}

					{/* Drag handle (only this is draggable) */}
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

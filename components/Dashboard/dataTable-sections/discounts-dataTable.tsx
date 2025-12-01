'use client';
import { url_segment } from '@/app/[locale]/dashboard/(products-management)/brands/page';
import { TLocalesData } from '@/configs/general';
import { useServerResponse } from '@/hooks/use-server-response';
import { formDate } from '@/lib/utils';
import { getDataInPage } from '@/lib/utils.server/api.server';
import {
	deleteDiscountAction,
	deleteManyDiscountsAction,
	toggleStateDiscountAction,
} from '@/server/actions/discount-actions';
import { Discount } from '@/server/services/discount-service';
import { ActionResult, ApiMeta, TQueryParams } from '@/types/api';
import { DiscountType } from '@prisma/client';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useOptimistic, useState, useTransition } from 'react';
import { Switch } from '../../ui/switch';
import ReusableDataTable from '../dataTable/reusable-data-table';

type TFormValues = Discount;

export default function DiscountDataTable({ result, locale }: { result: ActionResult<TFormValues>; locale: TLocalesData }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [isPending, startTransition] = useTransition();
	const [response, setResponse] = useState<ActionResult | null>(result);
	useServerResponse(response);

	// ✅ Optimistic UI state
	const [optimisticData, setOptimisticData] = useOptimistic<TFormValues[]>((result.data as TFormValues[]) ?? []);
	const [meta, setMeta] = useState<ApiMeta>(result.meta as ApiMeta);
	console.log('meta--', meta);

	// ---------------------------------------------------------
	// URL Query Parameters
	// ---------------------------------------------------------
	// const page = Number(searchParams.get('page')) || meta?.pagination?.page;
	// const search = searchParams.get('search') || meta?.query?.search || '';
	// const sortBy = searchParams.get('sortBy') || meta?.sort?.by;
	// const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || meta?.sort?.order || 'desc';

	// ---------------------------------------------------------
	// Update URL Parameters
	// ---------------------------------------------------------
	const updateUrlParams = (params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams(searchParams.toString());

		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === '') query.delete(key);
			else query.set(key, String(value));
		});

		// ⚙️ Use .replace instead of .push to avoid full rerender and history entry
		router.replace(`?${query.toString()}`, { scroll: false });
	};

	// ---------------------------------------------------------
	// Unified Server Fetch Function
	// ---------------------------------------------------------
	const handleServerRequest = useCallback(
		async ({ page, limit, search, sortBy, sortOrder }: TQueryParams) => {
			const res: ActionResult<TFormValues> = await getDataInPage<TFormValues>({
				url_segment: url_segment,
				tags: ['brands'],
				locale,
				query: { page, limit, search, sortBy, sortOrder },
			});

			startTransition(() => {
				setOptimisticData((res.data as TFormValues[]) ?? []);
				setMeta(res.meta as ApiMeta);
			});
		},
		[locale]
	);

	// ---------------------------------------------------------
	// Delete Single Row
	// ---------------------------------------------------------
	const handleDelete = async (id: string) => {
		startTransition(() => setOptimisticData((prev) => prev.filter((b) => b.id !== id)));
		// await runWithFeedback(() => deleteTFormValuesAction(id));
		const result = await deleteDiscountAction(id);
		setResponse(result);
	};

	// ---------------------------------------------------------
	// Delete Multiple Rows
	// ---------------------------------------------------------
	const handleDeleteMany = async (ids: string[]) => {
		startTransition(() => setOptimisticData((prev) => prev.filter((b) => !ids.includes(b.id))));
		const result = await deleteManyDiscountsAction(ids);
		setResponse(result);
	};

	// ---------------------------------------------------------
	// Toggle Status
	// ---------------------------------------------------------
	const handleToggleStatus = async (row: TFormValues) => {
		const result = await toggleStateDiscountAction(row.id, !row.isActive);
		console.log('result', result);
		setResponse(result);
	};

	// ---------------------------------------------------------
	// Table Columns Definition
	// ---------------------------------------------------------
	const columns: ColumnDef<TFormValues>[] = [
		{
			accessorKey: 'name',
			header: 'columns.name',
			cell: ({ row }) => (
				<Link
					href={`/dashboard/brands/${row.original.id}`}
					className='font-medium hover:underline text-primary'
					onClick={(e) => e.stopPropagation()}
				>
					{row.original?.name}
				</Link>
			),
		},
		{ accessorKey: 'type', header: 'columns.type' },
		{
			accessorKey: 'value',
			header: 'columns.value',
			cell: ({ row }) => (
				<div className='flex gap-1.5 items-center justify-center'>
					<span>{row.original.value}</span>
					<span>{row.original.type === DiscountType.PERCENTAGE ? '%' : 'EGP'}</span>
				</div>
			),
		},
		{
			accessorKey: 'isActive',
			header: 'columns.status',
			cell: ({ row }) => {
				const isActive = row.original.isActive;
				return (
					<div className='flex justify-center'>
						<Switch
							dir='ltr'
							aria-checked={isActive}
							aria-label={isActive ? 'Active' : 'Inactive'}
							id={row.original.id}
							checked={isActive}
							onClick={(e) => e.stopPropagation()}
							onCheckedChange={() => handleToggleStatus(row.original)}
						/>
					</div>
				);
			},
		},
		{
			accessorKey: 'startDate',
			header: 'columns.startDate',
			cell: ({ row }) => (
				<div>
					{/* <span className='text-lg leading-none'>{dayjs(row.original.startDate).format('hh:mm A - DD MMM,YYYY')}</span> */}
					<span className='text-lg leading-none'>{formDate(row.original.startDate)}</span>
				</div>
			),
		},
		{
			accessorKey: 'endDate',
			header: 'columns.endDate',
			cell: ({ row }) => (
				<div>
					{/* <span className='text-lg leading-none'>{dayjs(row.original.endDate).format('hh:mm A - DD MMM,YYYY')}</span> */}
					<span className='text-lg leading-none'> {row.original.endDate ? formDate(row.original.endDate) : '-'}</span>
				</div>
			),
		},
	];

	// ---------------------------------------------------------
	// Render
	// ---------------------------------------------------------
	return (
		<ReusableDataTable
			columns={columns}
			data={optimisticData}
			meta={meta}
			isPending={isPending}
			onServerRequest={handleServerRequest}
			onDeleteSingleRow={handleDelete}
			onDeleteRows={handleDeleteMany}
			onUpdateUrl={updateUrlParams}
		/>
	);
}

'use client';
import { url_segment } from '@/app/[locale]/dashboard/(products-management)/products/page';
import { imagesPlaceholder, TLocalesData } from '@/configs/general';
import { useServerResponse } from '@/hooks/use-server-response';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { deleteManyProductsAction, deleteProductAction, toggleStateProductAction } from '@/server/actions/product-actions';
import { TProductLocale } from '@/server/services/product-service';
import { ActionResult, ApiMeta, TImage, TQueryParams } from '@/types/api';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useOptimistic, useState, useTransition } from 'react';
import { Switch } from '../../ui/switch';
import ReusableDataTable from '../dataTable/reusable-data-table';

type sectionType = TProductLocale;

export default function ProductsDataTable({ result, locale }: { result: ActionResult<sectionType>; locale: TLocalesData }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [isPending, startTransition] = useTransition();
	const [response, setResponse] = useState<ActionResult | null>(result);
	useServerResponse(response);

	// ✅ Optimistic UI state
	const [optimisticData, setOptimisticData] = useOptimistic<sectionType[]>((result.data as sectionType[]) ?? []);
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
			const res: ActionResult<sectionType> = await getDataInPage<sectionType>({
				url_segment: url_segment,
				tags: ['Products'],
				locale,
				query: { page, limit, search, sortBy, sortOrder },
			});

			startTransition(() => {
				setOptimisticData((res.data as sectionType[]) ?? []);
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
		// await runWithFeedback(() => deleteProductAction(id));
		const result = await deleteProductAction(id);
		setResponse(result);
	};

	// ---------------------------------------------------------
	// Delete Multiple Rows
	// ---------------------------------------------------------
	const handleDeleteMany = async (ids: string[]) => {
		startTransition(() => setOptimisticData((prev) => prev.filter((b) => !ids.includes(b.id))));
		const result = await deleteManyProductsAction(ids);
		setResponse(result);
	};

	const handleToggleStatus = async (row: sectionType) => {
		const result = await toggleStateProductAction(row.id, !row.isActive);
		console.log('result', result);
		setResponse(result);
	};

	// ---------------------------------------------------------
	// Table Columns Definition
	// ---------------------------------------------------------
	const columns: ColumnDef<sectionType>[] = [
		{
			accessorKey: 'image',
			header: 'columns.image',
			cell: ({ row }) => (
				<Image
					src={(row.original.images?.[0] as TImage)?.url ?? imagesPlaceholder.imgMedium}
					width={40}
					height={40}
					alt={row.original.name}
					className='rounded-md aspect-square object-cover'
				/>
			),
			enableSorting: false,
			enablePinning: true,
			enableGrouping: true, // use this to disable dragging
		},
		{
			accessorKey: 'name',
			header: 'columns.name',
			cell: ({ row }) => (
				<Link
					href={`/dashboard/products/${row.original.id}`}
					className='font-medium hover:underline text-primary'
					onClick={(e) => e.stopPropagation()}
				>
					{row.original.name}
				</Link>
			),
		},
		{ accessorKey: 'shortDescription', header: 'columns.description' },

		{ accessorKey: 'basePrice', header: 'columns.price' },
		{ accessorKey: 'compareAtPrice', header: 'columns.compareAtPrice' },
		{ accessorKey: 'stockQuantity', header: 'columns.quantity' },
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
		// { accessorKey: 'slug', header: 'columns.slug' },
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

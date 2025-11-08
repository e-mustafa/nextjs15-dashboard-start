'use client';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, renderErrorMessage } from '@/lib/utils';
import { CheckIcon, ChevronsUpDown, Loader2, Trash2Icon, XIcon } from 'lucide-react';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { imagesPlaceholder } from '@/configs/general';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import TagForm from '../Dashboard/forms/tag-form';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from './custom-button';
import { Label } from '../ui/label';

export type ComboboxOptionWithIdAndName<T> = T & { id: string; name: string };

export interface ComboboxOption {
	id: string;
	name: string;
	image?: string | { url?: string };
	[key: string]: any;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasMore: boolean;
	};
	hasMore?: boolean;
}

interface ComboboxProps<T extends ComboboxOption> {
	options?: T[];
	fetchOptions?: (query: string, page?: number) => Promise<PaginatedResponse<T>>;
	isProducts?: boolean;
	isTags?: boolean;
	deleteTag?: (id: string) => Promise<void>;
	// PaginatedResponse<ComboboxOption> | ComboboxOption[]

	value?: string | string[];
	onChange?: (value: string | string[]) => void;
	multiple?: boolean;

	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string | ReactNode;
	className?: string;
	disabled?: boolean;

	renderOption?: (option: T) => ReactNode;
	renderSelected?: (options: T[]) => ReactNode;

	debounceMs?: number;
	pageSize?: number;
	enableInfiniteScroll?: boolean;
}

export default function ReusableCombobox<T extends ComboboxOption>({
	options: staticOptions = [],
	fetchOptions,
	isProducts = false,
	isTags = false,
	deleteTag,
	value,
	onChange,
	multiple = false,
	placeholder = 'forms.placeholders.choose_items',
	searchPlaceholder = 'forms.search.placeholder',
	emptyMessage = 'forms.search.no_results',
	className,
	disabled = false,
	renderOption,
	renderSelected,
	debounceMs = 300,
	pageSize = 10,
	enableInfiniteScroll = true,
}: ComboboxProps<T>) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [serverOptions, setServerOptions] = useState<T[]>([]);
	const [isPending, startTransition] = useTransition();
	const [isSearching, setIsSearching] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [totalPages, setTotalPages] = useState(1);

	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const observerTarget = useRef<HTMLDivElement>(null);

	const selectedIds = useMemo(() => {
		if (!value) return [];
		return Array.isArray(value) ? value : [value];
	}, [value]);

	const allOptions = useMemo(() => {
		const combined = [...staticOptions, ...serverOptions];
		const uniqueMap = new Map(combined.map((opt) => [opt.id, opt]));
		return Array.from(uniqueMap.values());
	}, [staticOptions, serverOptions]);

	const selectedOptions = useMemo(() => {
		return allOptions.filter((opt) => selectedIds.includes(opt.id));
	}, [allOptions, selectedIds]);

	const fetchData = useCallback(
		async (query: string, page: number, append = false) => {
			if (!fetchOptions) return;

			const loadingState = page === 1 ? setIsSearching : setIsLoadingMore;
			loadingState(true);

			try {
				const result = await fetchOptions(query, page);
				let newOptions: T[] = [];
				let paginationData = {
					hasMore: false,
					totalPages: 1,
				};

				if (Array.isArray(result)) {
					newOptions = result;
					paginationData.hasMore = result.length >= pageSize;
				} else {
					newOptions = result.data || [];
					paginationData.hasMore = result.pagination?.hasMore ?? result.hasMore ?? false;
					paginationData.totalPages = result.pagination?.totalPages ?? 1;
				}

				setServerOptions((prev) => (append ? [...prev, ...newOptions] : newOptions));
				setHasMore(paginationData.hasMore);
				setTotalPages(paginationData.totalPages);
			} catch (error: any) {
				console.error('Search failed:', error);
				if (!append) setServerOptions([]);
				setHasMore(false);
				toast.error(error?.error || error?.message || 'Failed to fetch search results.');
			} finally {
				loadingState(false);
			}
		},
		[fetchOptions, pageSize]
	);

	const debouncedSearch = useCallback(
		(() => {
			let timeoutId: NodeJS.Timeout;
			return (query: string) => {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					setCurrentPage(1);
					startTransition(() => {
						fetchData(query, 1, false);
					});
				}, debounceMs);
			};
		})(),
		[fetchData, debounceMs]
	);

	const loadMore = useCallback(async () => {
		if (!hasMore || isLoadingMore || !fetchOptions) return;

		const nextPage = currentPage + 1;
		setCurrentPage(nextPage);

		startTransition(() => {
			fetchData(searchQuery, nextPage, true);
		});
	}, [hasMore, isLoadingMore, fetchOptions, currentPage, searchQuery, fetchData]);

	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			if (fetchOptions) debouncedSearch(query);
		},
		[fetchOptions, debouncedSearch]
	);

	const filteredOptions = useMemo(() => {
		if (fetchOptions) return allOptions;
		if (!searchQuery) return allOptions;
		const query = searchQuery.toLowerCase();
		return allOptions.filter((opt) => opt.name.toLowerCase().includes(query));
	}, [allOptions, searchQuery, fetchOptions]);

	const hasImage = useMemo(() => {
		return allOptions.some((opt) => opt.images?.length > 0);
	}, [allOptions]);

	useEffect(() => {
		if (!enableInfiniteScroll || !fetchOptions || !open) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					loadMore();
				}
			},
			{ threshold: 0.1 }
		);

		const currentTarget = observerTarget.current;
		if (currentTarget) observer.observe(currentTarget);

		return () => {
			if (currentTarget) observer.unobserve(currentTarget);
		};
	}, [enableInfiniteScroll, fetchOptions, open, hasMore, isLoadingMore, loadMore]);

	useEffect(() => {
		if (open && fetchOptions && serverOptions.length === 0) {
			setCurrentPage(1);
			fetchData(searchQuery, 1, false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const handleSelect = useCallback(
		(optionId: string) => {
			if (disabled) return;
			let newValue: string | string[];

			if (multiple) {
				const newIds = selectedIds.includes(optionId)
					? selectedIds.filter((id) => id !== optionId)
					: [...selectedIds, optionId];
				newValue = newIds;
			} else {
				newValue = selectedIds.includes(optionId) ? '' : optionId;
				setOpen(false);
			}
			onChange?.(newValue);
		},
		[multiple, selectedIds, onChange, disabled]
	);

	const handleRemove = useCallback(
		(optionId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			if (disabled) return;
			const newIds = selectedIds.filter((id) => id !== optionId);
			onChange?.(newIds);
		},
		[selectedIds, onChange, disabled]
	);

	const renderTriggerContent = () => {
		if (renderSelected && selectedOptions.length > 0) {
			return renderSelected(selectedOptions);
		}

		if (multiple && !isProducts && selectedOptions.length > 0) {
			return (
				<div className='flex flex-wrap gap-1 flex-1 min-w-0'>
					{selectedOptions.slice(0, 2).map((opt) => (
						<Badge key={opt.id} variant='secondary' className='mr-1'>
							{opt.name}
							<button type='button' className='ml-1 hover:text-destructive' onClick={(e) => handleRemove(opt.id, e)}>
								<XIcon className='h-3 w-3' />
							</button>
						</Badge>
					))}
					{selectedOptions.length > 2 && <Badge variant='secondary'>+{selectedOptions.length - 2}</Badge>}
				</div>
			);
		}

		if (!multiple && !isProducts && selectedOptions.length > 0) {
			return (
				<span>{selectedOptions[0].name}</span>
				// <div className='flex flex-wrap gap-1 flex-1 min-w-0'>
				// 	{selectedOptions.slice(0, 2).map((opt) => (
				// 		<Badge key={opt.id} variant='secondary' className='mr-1'>
				// 			{opt.name}
				// 			<button type='button' className='ml-1 hover:text-destructive' onClick={(e) => handleRemove(opt.id, e)}>
				// 				<XIcon className='h-3 w-3' />
				// 			</button>
				// 		</Badge>
				// 	))}
				// 	{selectedOptions.length > 2 && <Badge variant='secondary'>+{selectedOptions.length - 2}</Badge>}
				// </div>
			);
		}

		if (selectedOptions.length === 1) {
			return selectedOptions[0].name;
		}

		return <span className='text-muted-foreground'>{renderErrorMessage(placeholder, t)}</span>;
	};

	const isLoading = isPending || isSearching;

	return (
		<div className='flex flex-col gap-3'>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						role='combobox'
						aria-expanded={open}
						disabled={disabled}
						className={cn(
							'w-full justify-between px-3',
							!selectedOptions.length && 'text-muted-foreground',
							className
						)}
					>
						<div className='flex items-center gap-2 flex-1 min-w-0 overflow-hidden'>
							<div className='grow text-start'>{renderTriggerContent()}</div>
							<ChevronsUpDown className='size-4 shrink-0 opacity-50 ms-auto' />
						</div>
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
					<Command shouldFilter={!fetchOptions}>
						<CommandInput
							placeholder={renderErrorMessage(searchPlaceholder, t)}
							value={searchQuery}
							onValueChange={handleSearch}
							className='h-9'
						/>
						<CommandList ref={scrollContainerRef} className='border-t border-muted-foreground/30'>
							{isLoading && currentPage === 1 ? (
								<div className='flex items-center justify-center gap-1 py-6'>
									<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
									<span className='ml-2 text-sm text-muted-foreground'>{t('forms.search.searching')}</span>
								</div>
							) : filteredOptions.length === 0 ? (
								<>
									{isTags && (
										<TagForm
											defaultValue={searchQuery}
											onSuccess={(newTag) => {
												handleSearch('');
												handleSelect(newTag.id as string);
											}}
										/>
									)}
									<CommandEmpty>
										{typeof emptyMessage === 'string'
											? renderErrorMessage(emptyMessage as string, t)
											: (emptyMessage as unknown as ReactNode)}
									</CommandEmpty>
								</>
							) : (
								<>
									<CommandGroup>
										{filteredOptions.map((option) => {
											const isSelected = selectedIds.includes(option.id);

											return (
												<CommandItem
													key={option.id}
													value={option.id}
													onSelect={() => handleSelect(option.id)}
													className='cursor-pointer items-center'
												>
													<CheckIcon
														className={cn('size-5 text-primary', isSelected ? 'opacity-100' : 'opacity-0')}
													/>
													<div className='flex items-center gap-2 flex-1'>
														{hasImage && (
															<Image
																src={
																	typeof option.image === 'string'
																		? option.image
																		: option.images[0]?.url || imagesPlaceholder.imgMedium
																}
																alt={option.name}
																width={40}
																height={40}
																className='size-10 object-cover aspect-square rounded'
															/>
														)}
														<span className='line-clamp-1 grow'>
															{renderOption ? renderOption(option) : option.name}
														</span>

														{isTags && (
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant='delete'
																		size='icon'
																		className='size-6'
																		onClick={() => deleteTag?.(option.id)}
																	>
																		<Trash2Icon className='h-4 w-4 text-foreground' />
																	</Button>
																</TooltipTrigger>
																<TooltipContent side='left'>
																	{t('common.actions.delete_permanently')}
																</TooltipContent>
															</Tooltip>
														)}
													</div>
												</CommandItem>
											);
										})}
									</CommandGroup>

									{enableInfiniteScroll && fetchOptions && (
										<div ref={observerTarget} className='py-2'>
											{isLoadingMore && (
												<div className='flex items-center justify-center gap-2 pb-2 text-muted-foreground text-xs'>
													<Loader2 className='size-4 animate-spin' />
													{t('common.messages.loading_more')}
												</div>
											)}
											{!hasMore && filteredOptions.length > 0 && (
												<div className='text-center pb-2 text-xs text-muted-foreground'>
													{t('common.messages.no_more_items')}
												</div>
											)}
										</div>
									)}
								</>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{isProducts && (
				<div className='grid gap-1'>
					<Label>{t('common.sections.selected_Products')}:</Label>
					<div className='flex flex-col gap-2 rounded-md border bg-input/30 inset-shadow p-3 text-muted-foreground max-h-96 overflow-y-auto'>
						{!selectedOptions.length ? (
							<span className='text-center'>{t('common.sections.no_selected_Products')}</span>
						) : (
							selectedOptions.map((option) => {
								const isSelected = selectedIds.includes(option.id);

								return (
									<div
										key={option.id}
										className='cursor-pointer flex gap-2 items-center hover:bg-accent hover:text-accent-foreground rounded-md'
									>
										{/* <CheckIcon className={cn('size-5 text-primary', isSelected ? 'opacity-100' : 'opacity-0')} /> */}
										<div className='flex items-center gap-2 flex-1'>
											{hasImage && (
												<Image
													src={
														typeof option.image === 'string'
															? option.image
															: option.images[0]?.url || imagesPlaceholder.imgMedium
													}
													alt={option.name}
													width={40}
													height={40}
													className='size-10 object-cover aspect-square rounded'
												/>
											)}
											<Link href={`/dashboard/brands/${option.id}`} className='line-clamp-1 grow'>
												{renderOption ? renderOption(option) : option.name}
											</Link>

											<Tooltip>
												<TooltipTrigger asChild>
													<Button variant='delete' size='icon' onClick={(e) => handleRemove(option.id, e)}>
														<XIcon className='h-4 w-4 text-foreground' />
													</Button>
												</TooltipTrigger>
												<TooltipContent side='left'>{t('common.actions.remove')}</TooltipContent>
											</Tooltip>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}

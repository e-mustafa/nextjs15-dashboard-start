import UploadImageShaped from '@/components/inputs/upload-image-shaped';
import { Checkbox } from '@/components/ui-custom/custom-checkbox';
import { Input } from '@/components/ui/input';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Combination, GroupedCombination, ProductVariantsForm } from './types';
import { groupCombinationsBy } from './utils';

// =================================
// COMBINATIONS TABLE
// =================================
export default function CombinationsTable({ groupBy }: { groupBy?: string }) {
	const { control, setValue, watch } = useFormContext<ProductVariantsForm>();
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

	const { t } = useTranslation();

	const combinations = watch('combinations') as Combination[];

	const [groupPrices, setGroupPrices] = useState<Record<string, string>>({});

	const groupedData = useMemo(() => {
		if (!groupBy || !combinations) return [];
		return groupCombinationsBy(combinations, groupBy);
	}, [combinations, groupBy]);

	const displayData = groupBy ? groupedData : combinations;

	const toggleRow = (id: string) => {
		setExpandedRows((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const handleCheckAll = (checked: boolean) => {
		combinations.forEach((_, idx) => {
			setValue(`combinations.${idx}.checked`, checked);
		});
	};

	const handleCheckGroup = (group: GroupedCombination, checked: boolean) => {
		group.items.forEach((item) => {
			const idx = combinations.findIndex((c) => c.id === item.id);
			if (idx !== -1) {
				setValue(`combinations.${idx}.checked`, checked);
			}
		});
	};

	const handleCheckSingle = (id: string, checked: boolean) => {
		const idx = combinations.findIndex((c) => c.id === id);
		if (idx !== -1) {
			setValue(`combinations.${idx}.checked`, checked);
		}
	};

	// const updateGroupPrice = (group: GroupedCombination, price: string) => {
	// 	group.items.forEach((item) => {
	// 		const idx = combinations.findIndex((c) => c.id === item.id);
	// 		if (idx !== -1) {
	// 			setValue(`combinations.${idx}.price`, price);
	// 		}
	// 	});
	// };

	const updateGroupPrice = (groupTitle: string, price: string) => {
		// 1. Update local state (does not cause full table re-render)
		setGroupPrices((prev) => ({ ...prev, [groupTitle]: price }));
	};

	// ✅ Apply changes on blur
	const applyGroupPrice = (group: GroupedCombination) => {
		const price = groupPrices[group.title];
		if (price !== undefined) {
			group.items.forEach((item) => {
				const idx = combinations.findIndex((c) => c.id === item.id);
				if (idx !== -1) {
					setValue(`combinations.${idx}.price`, price, {
						shouldDirty: true,
						shouldTouch: true,
					});
				}
			});
		}
	};

	const allChecked = combinations.every((c) => c.checked);
	const someChecked = combinations.some((c) => c.checked) && !allChecked;
	const checkedCount = combinations.filter((c) => c.checked).length;

	if (!combinations || combinations.length === 0) {
		return <div className='p-8 text-center text-muted-foreground'>{t('forms.infos.add_variants')}</div>;
	}

	return (
		<div>
			{checkedCount > 0 && (
				<div className='bg-primary/10 border-b px-4 py-3'>
					<div className='flex items-center gap-3'>
						<div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
							<CheckIcon className='w-5 h-5 text-primary-foreground' />
						</div>
						<span className='font-medium'>
							{checkedCount} combination{checkedCount > 1 ? 's' : ''} selected
						</span>
					</div>
				</div>
			)}

			<div className='overflow-x-auto max-h-[500px] overflow-y-auto'>
				<table className='w-full table-auto'>
					<thead className='sticky top-0 bg-accent z-10'>
						<tr className='border-b'>
							<th className='p-2 text-center'>
								<Checkbox
									checked={allChecked ? true : someChecked ? 'indeterminate' : false}
									onCheckedChange={handleCheckAll}
								/>
							</th>
							<th className='p-2 text-center text-xs font-semibold uppercase'>{t('forms.labels.variant')}</th>
							<th className='p-2 text-center text-xs font-semibold uppercase'>{t('forms.labels.price')}</th>
							<th className='p-2 text-center text-xs font-semibold uppercase'>{t('forms.labels.quantity')}</th>
							<th className='p-2 text-center text-xs font-semibold uppercase'>SKU</th>
						</tr>
					</thead>
					<tbody>
						{groupBy
							? groupedData.map((group, groupIdx) => (
									<Fragment key={`group-${groupIdx}`}>
										<tr className='border-b hover:bg-muted/50'>
											<td className='p-2'>
												<Checkbox
													checked={group.items.every((item) => item.checked)}
													onCheckedChange={(checked) => handleCheckGroup(group, checked === true)}
												/>
											</td>
											<td className='p-2'>
												{/* Variant Column */}
												<div className='flex items-center gap-3'>
													<div className='size-12 bg-muted rounded flex items-center justify-center'>
														{/* <ImageIcon className='w-6 h-6 text-muted-foreground' /> */}
														<Controller
															name={`combinations.${groupIdx}.images`}
															control={control}
															render={({ field }) => (
																<UploadImageShaped
																	multiple={true}
																	// maxFiles={5}
																	value={field.value}
																	onChange={field.onChange}
																/>
															)}
														/>
													</div>
													<div>
														<div className='font-medium'>{group.title_ar}</div>
														<div className='text-sm text-muted-foreground'>{group.title_en}</div>
														{group.items.length > 0 && (
															<button
																type='button'
																onClick={() => toggleRow(group.title)}
																className='text-sm text-primary hover:underline flex items-center gap-1 mt-1'
															>
																{group.items.length} variant{group.items.length > 1 ? 's' : ''}
																{expandedRows.has(group.title) ? (
																	<ChevronUpIcon className='w-4 h-4' />
																) : (
																	<ChevronDownIcon className='w-4 h-4' />
																)}
															</button>
														)}
													</div>
												</div>
											</td>
											<td className='p-2'>
												{/* Price Column */}
												<div className='flex items-center gap-1 max-w-[120px]'>
													<span className='text-muted-foreground'>$</span>
													<Input
														type='number'
														value={groupPrices[group.title] ?? group.price}
														onChange={(e) => updateGroupPrice(group.title, e.target.value)}
														onBlur={() => applyGroupPrice(group)}
														placeholder='0.00'
														step='0.01'
														min='0'
														className='text-sm'
													/>
												</div>
											</td>
											<td className='p-2 text-center'>
												{/* Quantity Column */}
												<span className='text-sm'>
													{group.items?.reduce((acc, item) => +acc + +item.qty, 0)}
												</span>
											</td>
											<td className='p-2'>
												{/* SKU Column - Empty for group */}
												<div className='text-xs text-muted-foreground text-center'>—</div>
											</td>
										</tr>

										{expandedRows.has(group.title) &&
											group.items.map((item) => {
												const comboIdx = combinations.findIndex((c) => c.id === item.id);
												return (
													<tr key={item.id} className='border-b hover:bg-muted/30'>
														<td className='p-2 pl-12'>
															<Checkbox
																checked={item.checked}
																onCheckedChange={(checked) => handleCheckSingle(item.id, checked === true)}
															/>
														</td>
														<td className='p-2'>
															{/* Variant Column */}
															<div className='flex items-center gap-3'>
																<div className='w-10 h-10 bg-muted rounded flex items-center justify-center'>
																	{/* <ImageIcon className='w-5 h-5 text-muted-foreground' /> */}
																	<Controller
																		name={`combinations.${comboIdx}.images`}
																		control={control}
																		render={({ field }) => (
																			<UploadImageShaped
																				// name={`combinations.${groupIdx}.images`}
																				multiple={true}
																				// maxFiles={5}
																				value={field.value}
																				onChange={field.onChange}
																			/>
																		)}
																	/>
																</div>
																<div className='text-sm'>
																	<p>{item.attributes.map((attr) => `${attr.value_ar} `).join(' • ')}</p>
																	<p>{item.attributes.map((attr) => `${attr.value_en} `).join(' • ')}</p>
																</div>
															</div>
														</td>
														<td className='p-2'>
															{/* Price Column */}
															<Controller
																name={`combinations.${comboIdx}.price`}
																control={control}
																render={({ field }) => (
																	<div className='flex items-center gap-1 max-w-[120px]'>
																		<span className='text-muted-foreground'>$</span>
																		<Input
																			{...field}
																			type='number'
																			placeholder='0.00'
																			step='0.01'
																			min='0'
																			className='text-sm'
																		/>
																	</div>
																)}
															/>
														</td>
														<td className='p-2'>
															{/* Quantity Column */}
															<Controller
																name={`combinations.${comboIdx}.qty`}
																control={control}
																render={({ field }) => (
																	<Input
																		{...field}
																		type='number'
																		placeholder='0'
																		min='0'
																		className='text-sm max-w-20'
																	/>
																)}
															/>
														</td>
														<td className='p-2'>
															{/* SKU Column */}
															<Controller
																name={`combinations.${comboIdx}.sku`}
																control={control}
																render={({ field }) => (
																	<Input
																		{...field}
																		type='text'
																		placeholder='sku-abcd-123'
																		className='text-sm'
																	/>
																)}
															/>
														</td>
													</tr>
												);
											})}
									</Fragment>
							  ))
							: combinations.map((combo, idx) => (
									<tr key={combo.id} className='border-b hover:bg-muted/50'>
										<td className='p-2'>
											<Checkbox
												checked={combo.checked}
												onCheckedChange={(checked) => handleCheckSingle(combo.id, checked === true)}
											/>
										</td>
										<td className='p-2'>
											{/* Variant Column */}
											<div className='flex items-center gap-3'>
												<div className='size-12 bg-muted rounded flex items-center justify-center'>
													{/* <ImageIcon className='w-6 h-6 text-muted-foreground' /> */}
													{/* <UploadImageShaped {...{ name: `combinations.${idx}.image`, multiple: true }} /> */}
													<Controller
														name={`combinations.${idx}.images`}
														control={control}
														render={({ field }) => (
															<UploadImageShaped
																multiple={true}
																// maxFiles={5}
																value={field.value}
																onChange={field.onChange}
															/>
														)}
													/>
												</div>
												<div className='text-sm space-y-1'>
													{combo.attributes.map((attr, i) => (
														<div key={i}>
															<span className='font-medium'>{attr.value_ar}</span>
															{' / '}
															<span className='text-muted-foreground'>{attr.value_en}</span>
														</div>
													))}
												</div>
											</div>
										</td>
										<td className='p-2'>
											{/* Price Column */}
											<Controller
												name={`combinations.${idx}.price`}
												control={control}
												render={({ field }) => (
													<div className='flex items-center gap-1 max-w-[120px]'>
														<span className='text-muted-foreground'>$</span>
														<Input
															{...field}
															type='number'
															placeholder='0.00'
															step='0.01'
															min='0'
															className='text-sm'
														/>
													</div>
												)}
											/>
										</td>
										<td className='p-2'>
											{/* Quantity Column */}
											<Controller
												name={`combinations.${idx}.qty`}
												control={control}
												render={({ field }) => (
													<Input
														type='number'
														placeholder='0'
														min='0'
														className='text-sm max-w-20'
														{...field}
													/>
												)}
											/>
										</td>
										<td className='p-2'>
											{/* SKU Column */}
											<Controller
												name={`combinations.${idx}.sku`}
												control={control}
												render={({ field }) => (
													<Input {...field} type='text' placeholder='sku-abcd-123' className='text-sm' />
												)}
											/>
										</td>
									</tr>
							  ))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

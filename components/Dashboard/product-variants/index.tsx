import UploadImageShaped from '@/components/inputs/upload-image-shaped';
import { Button } from '@/components/ui-custom/custom-button';
import { Checkbox } from '@/components/ui-custom/custom-checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessageTranslated } from '@/components/ui-custom/custom-form';
import TooltipElement from '@/components/ui-custom/tooltip-element';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useLocale from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	DraggableAttributes,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	GripHorizontalIcon,
	GripIcon,
	ImageIcon,
	PlusIcon,
	Trash2Icon,
} from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, FieldError, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
	AttributeBackend,
	Combination,
	GroupedCombination,
	ProductVariantsForm,
	VariantBackend,
	VariantForm,
	VariantOption,
} from './types';
import { calculateTotals, generateCombinations, generateId, groupCombinationsBy, normalizeBackendToForm } from './utils';

// =================================
// SORTABLE WRAPPER
// =================================
function SortableWrapper({
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
	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};
	return <>{children({ setNodeRef, listeners, attributes, style })}</>;
}

// =================================
// VARIANT OPTIONS LIST
// =================================
function VariantOptionsList({ controlName, error }: { controlName: string; error?: FieldError }) {
	const { t } = useTranslation();
	const { control } = useFormContext<ProductVariantsForm>();
	const { fields, move, append, remove } = useFieldArray({
		control,
		name: controlName as any,
	});

	console.log('fields', fields);

	// const [isColors, setIsColors] = useState(fields?.some((option) => !!option.colorHex));
	const [isColors, setIsColors] = useState(fields?.some((option) => (option as VariantOption).colorHex));

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const onDragEnd = useCallback(
		(e: DragEndEvent) => {
			const { active, over } = e;
			if (!over || active.id === over.id) return;

			const oldIndex = fields.findIndex((f) => f.id === String(active.id));
			const newIndex = fields.findIndex((f) => f.id === String(over.id));

			if (oldIndex !== -1 && newIndex !== -1) {
				move(oldIndex, newIndex);
			}
		},
		[fields, move]
	);

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
			<SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
				<div className='space-y-2'>
					<div className='flex gap-2 items-center'>
						<Checkbox id='for-colors' checked={isColors} onCheckedChange={(checked) => setIsColors(!!checked)} />
						<Label htmlFor='for-colors'>{t('forms.labels.add_color_code')}</Label>
					</div>

					{fields.map((opt, idx) => (
						<SortableWrapper key={opt.id} id={opt.id}>
							{({ setNodeRef, listeners, attributes, style }) => (
								<div ref={setNodeRef} style={style} className='flex items-center gap-2'>
									<div
										{...listeners}
										{...attributes}
										className='cursor-move px-2 touch-none h-8 grid place-items-center'
									>
										<GripHorizontalIcon className='size-4' />
									</div>

									<div className='flex gap-2 flex-1'>
										<Controller
											name={`${controlName}.${idx}.value_ar` as any}
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													aria-invalid={!!error}
													autoFocus={!!error}
													placeholder={t('forms.placeholders.variant_option_ar') || 'Arabic value'}
													className='flex-1'
												/>
											)}
										/>

										<Controller
											name={`${controlName}.${idx}.value_en` as any}
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													aria-invalid={!!error}
													autoFocus={!!error}
													placeholder={t('forms.placeholders.variant_option_en') || 'English value'}
													className='flex-1'
												/>
											)}
										/>

										{isColors && (
											<Controller
												name={`${controlName}.${idx}.colorHex` as any}
												control={control}
												render={({ field }) => (
													<Input
														type='color'
														{...field}
														aria-invalid={!!error}
														autoFocus={!!error}
														placeholder={t('forms.placeholders.variant_option_en') || 'English value'}
														className='size-9 p-1'
													/>
												)}
											/>
										)}
									</div>

									<TooltipElement content={t('common.actions.delete_option') || 'Delete option'}>
										<Button type='button' variant='delete' size='icon' onClick={() => remove(idx)}>
											<Trash2Icon className='size-4' />
										</Button>
									</TooltipElement>
								</div>
							)}
						</SortableWrapper>
					))}

					<TooltipElement content={t('common.actions.add_option') || 'Add option'}>
						<Button
							type='button'
							// variant='outline'
							size='icon'
							onClick={() =>
								append({
									id: generateId(),
									value_ar: '',
									value_en: '',
								})
							}
						>
							<PlusIcon className='size-4' />
							{/* {t('common.actions.add_option') || 'Add option'} */}
						</Button>
					</TooltipElement>
				</div>
			</SortableContext>
		</DndContext>
	);
}

// =================================
// VARIANT EDITOR
// =================================
function VariantEditor({ index, onRemove }: { index: number; onRemove: () => void }) {
	const { t } = useTranslation();
	const methods = useFormContext<ProductVariantsForm>();
	const { control, setValue, trigger, getValues, setError, clearErrors } = methods;
	const variantPath = `variants.${index}` as const;
	const variant = useWatch({ name: variantPath, control }) as VariantForm | undefined;

	useEffect(() => {
		if (variant && (!variant.options || variant.options.length === 0)) {
			setValue(`${variantPath}.options`, [{ id: generateId('opt'), value_ar: '', value_en: '' }]);
			// setValue(`${variantPath}.isEditing`, true);
		}
	}, [variant, variantPath, setValue]);

	if (!variant) return null;

	const handleSave = async () => {
		// 1) Trigger validation for titles (these are FormField with rules)
		const okTitles = await trigger([`${variantPath}.title_ar`, `${variantPath}.title_en`]);
		const currentVariant = getValues(`${variantPath}`) || {};
		if (!currentVariant.title_ar) {
			// set a validation error on the options field so FormMessage can show it
			setError(`${variantPath}.title_ar`, {
				type: 'manual',
				message: t('forms.validation.required') || 'Please type a arabic title',
			});
			return;
		} else {
			// if there was a previous error, clear it
			clearErrors(`${variantPath}.title_ar`);
		}
		if (!currentVariant.title_en) {
			// set a validation error on the options field so FormMessage can show it
			setError(`${variantPath}.title_en`, {
				type: 'manual',
				message: t('forms.validation.required') || 'Please type a english title',
			});
			return;
		} else {
			// if there was a previous error, clear it
			clearErrors(`${variantPath}.title_en`);
		}

		// 2) Clean options (trim + remove empty)
		const currentOptions = getValues(`${variantPath}.options`) || [];
		const cleanedOptions = currentOptions
			.map((o) => ({ ...o, value_ar: String(o.value_ar || '').trim(), value_en: String(o.value_en || '').trim() }))
			.filter((o) => o.value_ar !== '' || o.value_en !== '');

		// 3) If no options left => set error on options path and abort
		if (cleanedOptions.length === 0) {
			// set a validation error on the options field so FormMessage can show it
			setError(`${variantPath}.options`, {
				type: 'manual',
				message: t('forms.validation.at_least_one_option') || 'Please add at least one option',
			});
			return;
		} else {
			// if there was a previous error, clear it
			clearErrors(`${variantPath}.options`);
		}

		// 4) If titles invalid -> abort (FormMessage will show)
		if (!okTitles) return;

		// 5) Save cleaned options and close editing
		setValue(`${variantPath}.options`, cleanedOptions);
		// setValue(`${variantPath}.isEditing`, false);
		setValue(`${variantPath}.isEditing`, false, {
			shouldDirty: true,
			shouldTouch: true,
			shouldValidate: true,
		});
		await trigger(`variants`);
	};

	const toggleEdit = () => {
		if (variant.isEditing) {
			handleSave();
		} else {
			// when entering edit mode, clear option errors for that variant
			clearErrors(`${variantPath}.options`);
			setValue(`${variantPath}.isEditing`, true);
		}
	};

	return (
		<div className='border-b last:border-0'>
			<div className={cn('flex gap-3', variant.isEditing && 'flex-col')}>
				{/* Variant Title (you already have FormField wrappers for titles) */}
				<div className='flex-1'>
					{variant.isEditing ? (
						<div className='flex gap-3 items-start'>
							{/* Arabic */}
							<FormField
								control={control}
								name={`${variantPath}.title_ar`}
								render={({ field, fieldState }) => (
									<FormItem className='flex-1'>
										<FormLabel>{t('forms.labels.variant_title_ar') || 'Arabic Title'}</FormLabel>
										<FormControl>
											<Input
												aria-invalid={!!fieldState.error}
												placeholder={t('forms.placeholders.variant_title_ar') || ''}
												{...field}
											/>
										</FormControl>
										<FormMessageTranslated />
									</FormItem>
								)}
							/>

							{/* English */}
							<FormField
								control={control}
								name={`${variantPath}.title_en`}
								render={({ field, fieldState }) => (
									<FormItem className='flex-1'>
										<FormLabel>{t('forms.labels.variant_title_en') || 'English Title'}</FormLabel>
										<FormControl>
											<Input
												aria-invalid={!!fieldState.error}
												placeholder={t('forms.placeholders.variant_title_en') || ''}
												{...field}
											/>
										</FormControl>
										<FormMessageTranslated />
									</FormItem>
								)}
							/>
						</div>
					) : (
						<div>
							<div className='font-semibold text-lg'>{variant.title_ar || variant.title_en || 'Untitled'}</div>
							<div className='text-sm text-muted-foreground'>{variant.title_en}</div>
						</div>
					)}

					{/* Variant Options: WRAP with FormField so FormMessage can show options error */}
					<div className='mt-3'>
						{variant.isEditing ? (
							<FormField
								control={control}
								name={`${variantPath}.options`}
								// no inline rules here — we'll set manual error in handleSave if needed
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel>{t('forms.placeholders.variant_options') || 'Options'}</FormLabel>
										<FormControl>
											<VariantOptionsList controlName={`${variantPath}.options`} error={fieldState.error} />
										</FormControl>
										<FormMessageTranslated />
									</FormItem>
								)}
							/>
						) : (
							<div className='flex flex-wrap gap-2'>
								{variant.options?.map((opt, i) => (
									<div key={opt.id || i} className='space-y-1 flex items-center flex-col'>
										{opt.value_ar && (
											<span className='inline-block px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-sm border'>
												{opt.value_ar}
											</span>
										)}
										{opt.value_en && (
											<span className='inline-block px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-sm border'>
												{opt.value_en}
											</span>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className={cn('flex gap-2 items-center justify-center', !variant.isEditing && 'flex-col')}>
					<Button type='button' variant={variant.isEditing ? 'default' : 'outline'} size='sm' onClick={toggleEdit}>
						{variant.isEditing ? t('common.actions.save') || 'Save' : t('common.actions.edit') || 'Edit'}
					</Button>
					<Button type='button' variant='delete' size='sm' onClick={onRemove}>
						{t('common.actions.delete') || 'Delete'}
					</Button>
				</div>
			</div>
		</div>
	);
}

// =================================
// COMBINATIONS TABLE
// =================================
function CombinationsTable({ groupBy }: { groupBy?: string }) {
	const { control, setValue, watch } = useFormContext<ProductVariantsForm>();
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

	const { t } = useTranslation();

	const combinations = watch('combinations') as Combination[];

	const [groupPrices, setGroupPrices] = useState<Record<string, string>>({});

	console.log('combinations', combinations);

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

// =================================
// GROUP BY SELECTOR
// =================================
function GroupBySelector({
	variants,
	value,
	onChange,
}: {
	variants: VariantForm[];
	value?: string;
	onChange: (v: string | undefined) => void;
}) {
	const { t, dir } = useLocale();
	return (
		<div className='flex items-center gap-2'>
			<Label className='text-sm'>{t('common.actions.group_by')}:</Label>
			<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? undefined : v)}>
				<SelectTrigger className='w-[200px] rtl:flex-row-reverse'>
					<SelectValue placeholder={t('common.actions.select_variant') || 'Select variant'} />
				</SelectTrigger>
				<SelectContent className='rtl:flex-row-reverse'>
					<SelectGroup>
						<SelectItem value='none' className='rtl:flex-row-reverse'>
							{t('common.actions.none') || 'None'}
						</SelectItem>
						{variants
							?.filter((v) => v.title_ar || v.title_en)
							.map((item) => (
								<SelectItem
									key={item.id}
									value={`${item.title_ar || ''} - ${item.title_en || ''}`}
									className=' rtl:flex-row-reverse'
								>
									{`${item.title_en || ''} - ${item.title_ar || ''}`}
								</SelectItem>
							))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}

// =================================
// MAIN COMPONENT
// =================================
export default function ProductVariantsComponent({
	backendVariants,
	availableAttributes,
	productSKU,
}: {
	backendVariants?: VariantBackend[];
	availableAttributes?: AttributeBackend[];
	productSKU?: string;
}) {
	const { t } = useTranslation();
	const { control, watch, setValue, reset, getValues } = useFormContext<ProductVariantsForm>();

	const variantsArray = useFieldArray({ control, name: 'variants' });
	const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
	const [isInitialized, setIsInitialized] = useState(false);
	const [skipGeneration, setSkipGeneration] = useState(false); // ✅ إضافة flag جديد

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Initialize from backend data ONCE
	useEffect(() => {
		if (backendVariants && backendVariants.length > 0 && !isInitialized && availableAttributes) {
			console.log('🔄 Initializing from backend...');
			const normalized = normalizeBackendToForm(backendVariants, availableAttributes);

			console.log('✅ Normalized combinations:', normalized.combinations);

			// ✅ منع توليد combinations جديدة بعد التهيئة
			setSkipGeneration(true);

			reset(
				{
					...getValues(),
					variants: normalized.variants,
					combinations: normalized.combinations,
				},
				{
					keepDefaultValues: false,
				}
			);

			setIsInitialized(true);

			// ✅ السماح بتوليد combinations بعد فترة قصيرة
			setTimeout(() => {
				setSkipGeneration(false);
			}, 500);
		}
	}, [backendVariants, availableAttributes, reset, getValues, isInitialized]);

	const variants = watch('variants') as VariantForm[] | undefined;

	// ✅ Generate combinations only when variants change (not on initial load)
	useEffect(() => {
		// ✅ تجاهل التنفيذ عند التهيئة من backend
		if (skipGeneration) {
			console.log('⏭️ Skipping generation - still initializing');
			return;
		}

		// Skip if still initializing from backend
		if (!isInitialized && backendVariants && backendVariants.length > 0) {
			console.log('⏭️ Skipping generation - not initialized yet');
			return;
		}

		console.log('🔄 Variants changed, generating combinations...');

		if (!variants || variants.length === 0) {
			console.log('❌ No variants found');
			setValue('combinations', []);
			return;
		}

		// Filter only saved (non-editing) variants
		const savedVariants = variants.filter((v) => !v.isEditing);

		console.log('📊 Variants status:', {
			total: variants.length,
			saved: savedVariants.length,
			editing: variants.filter((v) => v.isEditing).length,
		});

		if (savedVariants.length === 0) {
			console.log('❌ No saved variants, clearing combinations');
			setValue('combinations', []);
			return;
		}

		// Check if saved variants have valid data
		const hasValidData = savedVariants.every(
			(v) =>
				(v.title_ar || v.title_en) &&
				v.options &&
				v.options.length > 0 &&
				v.options.some((opt) => opt.value_ar || opt.value_en)
		);

		if (!hasValidData) {
			console.log('❌ Invalid variant data');
			setValue('combinations', []);
			return;
		}

		// ✅ احتفظ بالبيانات الموجودة (qty, price, etc) عند إعادة التوليد
		const existingCombinations = getValues('combinations') || [];

		// Generate new combinations
		console.log('✅ Generating combinations...');
		const newCombos = generateCombinations(savedVariants, productSKU);
		console.log('✨ Generated', newCombos.length, 'combinations');

		// ✅ دمج البيانات القديمة مع الجديدة
		const mergedCombos = newCombos.map((newCombo) => {
			// ابحث عن combination مطابق في البيانات القديمة
			const existing = existingCombinations.find((old) => {
				// مطابقة بناءً على الـ attributes
				if (newCombo.attributes.length !== old.attributes.length) return false;

				return newCombo.attributes.every((attr) =>
					old.attributes.some(
						(oldAttr) => oldAttr.attributeId === attr.attributeId && oldAttr.attributeValueId === attr.attributeValueId
					)
				);
			});

			// إذا وُجد، احتفظ بالبيانات القديمة
			if (existing) {
				return {
					...newCombo,
					qty: existing.qty, // ✅ احتفظ بالكمية
					price: existing.price,
					compareAtPrice: existing.compareAtPrice,
					cost: existing.cost,
					images: existing.images,
					imageId: existing.imageId,
					checked: existing.checked,
					variantId: existing.variantId, // ✅ مهم للـ update
				};
			}

			return newCombo;
		});

		setValue('combinations', mergedCombos, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: false,
		});
	}, [variants, productSKU, setValue, getValues, isInitialized, backendVariants, skipGeneration]);

	const combinations = watch('combinations') as Combination[] | undefined;

	const onDragEndVariants = useCallback(
		(e: DragEndEvent) => {
			const { active, over } = e;
			if (!over || active.id === over.id) return;

			const oldIndex = variantsArray.fields.findIndex((f) => f.id === String(active.id));
			const newIndex = variantsArray.fields.findIndex((f) => f.id === String(over.id));

			if (oldIndex !== -1 && newIndex !== -1) {
				variantsArray.move(oldIndex, newIndex);
			}
		},
		[variantsArray]
	);

	const addVariant = useCallback(() => {
		variantsArray.append({
			id: generateId('v'),
			title_ar: '',
			title_en: '',
			options: [{ id: generateId('opt'), value_ar: '', value_en: '' }],
			isEditing: true,
		});
	}, [variantsArray]);

	const removeVariant = useCallback(
		(idx: number) => {
			variantsArray.remove(idx);
		},
		[variantsArray]
	);

	// Calculate statistics
	// const stats = useMemo(() => {
	// 	if (!combinations) return null;
	// 	return calculateTotals(combinations);
	// }, [combinations]);

	const stats = useMemo(() => {
		if (!combinations || combinations.length === 0) return null;

		return calculateTotals(combinations);
	}, [combinations?.length, JSON.stringify(combinations?.map((c) => ({ checked: c.checked, qty: c.qty })))]);

	return (
		<div className='space-y-6'>
			{/* Variants Editor */}
			{variantsArray.fields.length > 0 && (
				<>
					<div className='border rounded-lg p-1.5 sm:p-4'>
						<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndVariants}>
							<SortableContext
								items={variantsArray.fields.map((item) => item.id)}
								strategy={verticalListSortingStrategy}
							>
								{variantsArray.fields.map((v, idx) => (
									<SortableWrapper key={v.id} id={v.id}>
										{({ setNodeRef, listeners, attributes, style }) => (
											<div
												ref={setNodeRef}
												style={style}
												className='bg-muted/50 border rounded-lg p-2 sm:p-3 mb-3 '
											>
												<div className='flex gap-3 flex-col sm:flex-row'>
													<div {...listeners} {...attributes} className='cursor-move touch-none pt-2'>
														<GripIcon className='size-5 text-muted-foreground' />
													</div>
													<div className='flex-1'>
														<VariantEditor index={idx} onRemove={() => removeVariant(idx)} />
													</div>
												</div>
											</div>
										)}
									</SortableWrapper>
								))}
							</SortableContext>
						</DndContext>

						<div className='flex gap-4 items-center justify-between'>
							{stats && (
								<p className='text-sm text-muted-foreground mt-1'>
									{stats.checked} {t('pagination.of')} {stats.total} {t('common.sections.combinations_selected')} ·{' '}
									{t('common.sections.total_quantity')}: {stats.totalQty}
								</p>
							)}

							<Button type='button' onClick={addVariant} className='flex ms-auto'>
								<PlusIcon className='size-4 mr-2' />
								{t('common.actions.add_variant') || 'Add Variant'}
							</Button>
						</div>
					</div>

					{/* Combinations Table */}
					{combinations && combinations.length > 0 && (
						<div className='border rounded-lg overflow-hidden'>
							<div className='bg-muted/30 px-4 py-3 border-b'>
								{variants && variants.some((v) => v.title_ar || v.title_en) && (
									<GroupBySelector variants={variants} value={groupBy} onChange={setGroupBy} />
								)}
							</div>
							<CombinationsTable groupBy={groupBy} />
						</div>
					)}
				</>
			)}

			{variantsArray.fields.length === 0 && (
				<div className='border-2 border-dashed rounded-lg p-12 text-center'>
					<div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
						<ImageIcon className='w-8 h-8 text-muted-foreground' />
					</div>
					<h3 className='text-lg font-semibold mb-2'>{t('forms.placeholders.no_variants')}</h3>
					<p className='text-sm text-muted-foreground mb-6 max-w-md mx-auto'>{t('forms.descriptions.add_variants')}</p>
					<Button type='button' onClick={addVariant}>
						<PlusIcon className='size-4 mr-2' />
						{t('common.actions.add_variant') || 'Add Your First Variant'}
					</Button>
				</div>
			)}
		</div>
	);
}

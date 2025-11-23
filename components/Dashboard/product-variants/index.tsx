import ReusableSelect from '@/components/inputs/reusable-select';
import { ReusableDNDSortable, SortableDNDWrapper } from '@/components/shard/dnd-kit-sortable';
import { Button } from '@/components/ui-custom/custom-button';
import { Label } from '@/components/ui/label';
import { isDEV } from '@/configs/general';
import { GripIcon, NetworkIcon, PlusIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import CombinationsTable from './combinations-table';
import { AttributeBackend, Combination, ProductVariantsForm, VariantBackend, VariantForm } from './types';
import { calculateTotals, generateCombinations, generateId, normalizeBackendToForm } from './utils';
import VariantEditor from './variant-editor';

export const debugMode = isDEV && false; // Set to true to enable debug logs

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

	// Initialize from backend data ONCE
	useEffect(() => {
		if (backendVariants && backendVariants.length > 0 && !isInitialized && availableAttributes) {
			debugMode && console.log('🔄 Initializing from backend...');
			const normalized = normalizeBackendToForm(backendVariants, availableAttributes);

			// ✅prevent generating new combinations after initialization
			setSkipGeneration(true);

			// Reset form with normalized data
			reset(
				{
					...getValues(),
					variants: normalized.variants,
					combinations: normalized.combinations,
				},
				{ keepDefaultValues: false }
			);

			setIsInitialized(true);

			// ✅ allow generating combinations after a short delay
			setTimeout(() => {
				setSkipGeneration(false);
			}, 500);
		}
	}, [backendVariants, availableAttributes, reset, getValues, isInitialized]);

	const variants = watch('variants') as VariantForm[] | undefined;

	// ✅ Generate combinations only when variants change (not on initial load)
	useEffect(() => {
		// ✅ Completely ignore if data is from backend
		if (backendVariants && backendVariants.length > 0 && isInitialized) {
			debugMode && console.log('⏭️ Skipping generation - using backend data');
			return;
		}

		// ✅ Skip if still initializing
		if (skipGeneration) {
			debugMode && console.log('⏭️ Skipping generation - still initializing');
			return;
		}

		// Skip if still initializing from backend
		if (!isInitialized && backendVariants && backendVariants.length > 0) {
			debugMode && console.log('⏭️ Skipping generation - not initialized yet');
			return;
		}

		debugMode && console.log('🔄 Variants changed, generating combinations...');

		if (!variants || variants.length === 0) {
			debugMode && console.log('❌ No variants found');
			// ✅ Do not clear combinations if they are from backend
			if (!backendVariants || backendVariants.length === 0) {
				setValue('combinations', []);
			}
			return;
		}

		// Filter only saved (non-editing) variants
		const savedVariants = variants.filter((v) => !v.isEditing);

		debugMode &&
			console.log('📊 Variants status:', {
				total: variants.length,
				saved: savedVariants.length,
				editing: variants.filter((v) => v.isEditing).length,
			});

		if (savedVariants.length === 0) {
			debugMode && console.log('❌ No saved variants');
			// ✅ Do not clear combinations if they are from backend
			if (!backendVariants || backendVariants.length === 0) {
				setValue('combinations', []);
			}
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
			debugMode && console.log('❌ Invalid variant data');
			// ✅ Do not clear combinations if they are from backend
			if (!backendVariants || backendVariants.length === 0) {
				setValue('combinations', []);
			}
			return;
		}

		// ✅ Keep existing combinations data (qty, price, etc.) when regenerating
		const existingCombinations = getValues('combinations') || [];

		// Generate new combinations
		debugMode && console.log('✅ Generating combinations...');
		const newCombos = generateCombinations(savedVariants, productSKU);
		debugMode && console.log('✨ Generated', newCombos.length, 'combinations');

		// ✅ Merge existing data with new data
		const mergedCombos = newCombos.map((newCombo) => {
			const existing = existingCombinations.find((old) => {
				if (newCombo.attributes.length !== old.attributes.length) return false;

				return newCombo.attributes.every((attr) =>
					old.attributes.some(
						(oldAttr) => oldAttr.attributeId === attr.attributeId && oldAttr.attributeValueId === attr.attributeValueId
					)
				);
			});

			if (existing) {
				return {
					...newCombo,
					qty: existing.qty,
					price: existing.price,
					compareAtPrice: existing.compareAtPrice,
					cost: existing.cost,
					images: existing.images,
					imageId: existing.imageId,
					checked: existing.checked,
					variantId: existing.variantId,
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
						<ReusableDNDSortable items={variantsArray.fields} move={variantsArray.move}>
							{variantsArray.fields.map((v, idx) => (
								<SortableDNDWrapper key={v.id} id={v.id}>
									{({ setNodeRef, listeners, attributes, style }) => (
										<div ref={setNodeRef} style={style} className='bg-muted/50 border rounded-lg p-2 sm:p-3 mb-3 '>
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
								</SortableDNDWrapper>
							))}
						</ReusableDNDSortable>

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
									<div className='flex items-center gap-2'>
										<Label className='text-sm'>{t('common.actions.group_by')}:</Label>
										<ReusableSelect
											items={variants}
											value={groupBy}
											onChange={setGroupBy}
											placeholder='common.actions.select_variant'
										/>
									</div>
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
						<NetworkIcon className='w-8 h-8 text-muted-foreground' />
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

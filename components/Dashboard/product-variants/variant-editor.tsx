import { Button } from '@/components/ui-custom/custom-button';
import { FormControl, FormField, FormItem, FormLabel, FormMessageTranslated } from '@/components/ui-custom/custom-form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ProductVariantsForm, VariantForm } from './types';
import { generateId } from './utils';
import VariantOptionsList from './variant-options-list';

// =================================
// VARIANT EDITOR
// =================================

export default function VariantEditor({ index, onRemove }: { index: number; onRemove: () => void }) {
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

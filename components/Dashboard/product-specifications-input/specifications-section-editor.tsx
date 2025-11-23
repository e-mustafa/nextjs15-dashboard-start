'use client';
import { Button } from '@/components/ui-custom/custom-button';
import { FormControl, FormField, FormItem, FormLabel, FormMessageTranslated } from '@/components/ui-custom/custom-form';
import { Input } from '@/components/ui/input';
import { SpecificationProperty } from '@/server/services/product-service';
import { ArrayPath, FieldValues, Path, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SpecificationPropertiesList } from './specifications-properties-list';

// =================================
// SECTION EDITOR
// =================================
interface SectionEditorProps<TFieldValues extends FieldValues> {
	index: number;
	onRemove: () => void;
	fieldName?: Path<TFieldValues>;
}

export function SpecificationSectionEditor<TFieldValues extends FieldValues>({
	index,
	onRemove,
	fieldName = 'specifications' as Path<TFieldValues>,
}: SectionEditorProps<TFieldValues>) {
	const { t } = useTranslation();
	const { control, setValue, trigger, getValues, setError, clearErrors } = useFormContext<TFieldValues>();

	const sectionPath = `${fieldName}.${index}` as Path<TFieldValues>;
	const section = useWatch({ name: sectionPath, control });

	if (!section) return null;

	const handleSave = async () => {
		// 1) Trigger validation for titles
		const titleArPath = `${sectionPath}.title_ar` as Path<TFieldValues>;
		const titleEnPath = `${sectionPath}.title_en` as Path<TFieldValues>;

		const okTitles = await trigger([titleArPath, titleEnPath]);

		const currentSection = getValues(sectionPath);

		if (!currentSection?.title_ar) {
			setError(titleArPath, {
				type: 'manual',
				message: t('forms.validation.required') || 'Please type an Arabic title',
			});
			return;
		} else {
			clearErrors(titleArPath);
		}

		if (!currentSection?.title_en) {
			setError(titleEnPath, {
				type: 'manual',
				message: t('forms.validation.required') || 'Please type an English title',
			});
			return;
		} else {
			clearErrors(titleEnPath);
		}

		// 2) Clean properties (trim + remove empty)
		const propertiesPath = `${sectionPath}.properties` as Path<TFieldValues>;
		const currentProperties = getValues(propertiesPath) || [];

		const cleanedProperties = currentProperties
			.map((p: any) => ({
				...p,
				key_ar: String(p.key_ar || '').trim(),
				key_en: String(p.key_en || '').trim(),
				value_ar: String(p.value_ar || '').trim(),
				value_en: String(p.value_en || '').trim(),
			}))
			.filter((p: any) => p.key_ar !== '' || p.key_en !== '' || p.value_ar !== '' || p.value_en !== '');

		// 3) If no properties left => set error
		if (cleanedProperties.length === 0) {
			setError(propertiesPath, {
				type: 'manual',
				message: t('forms.validation.at_least_one_property') || 'Please add at least one property',
			});
			return;
		} else {
			clearErrors(propertiesPath);
		}

		// 4) If titles invalid -> abort
		if (!okTitles) return;

		// 5) Save cleaned properties and close editing
		setValue(propertiesPath, cleanedProperties as any);
		setValue(`${sectionPath}.isEditing` as Path<TFieldValues>, false as any, {
			shouldDirty: true,
			shouldTouch: true,
			shouldValidate: true,
		});
		await trigger(fieldName);
	};

	const toggleEdit = () => {
		if (section.isEditing) {
			handleSave();
		} else {
			clearErrors(`${sectionPath}.properties` as Path<TFieldValues>);
			setValue(`${sectionPath}.isEditing` as Path<TFieldValues>, true as any);
		}
	};

	return (
		<div className='flex gap-3 flex-col'>
			{/* Section Title */}
			<div className='flex-1'>
				{section.isEditing ? (
					<div className='space-y-3'>
						<div className='flex gap-3 items-start'>
							{/* Arabic Title */}
							<FormField
								control={control}
								name={`${sectionPath}.title_ar` as Path<TFieldValues>}
								render={({ field, fieldState }) => (
									<FormItem className='flex-1'>
										<FormLabel>{t('forms.labels.specs_section_title_ar') || 'Arabic'}</FormLabel>
										<FormControl>
											<Input
												{...field}
												value={field.value ?? ''}
												aria-invalid={!!fieldState.error}
												placeholder={t('forms.placeholders.specs_section_title_ar') || 'مثال: المواصفات التقنية'}
											/>
										</FormControl>
										<FormMessageTranslated />
									</FormItem>
								)}
							/>

							{/* English Title */}
							<FormField
								control={control}
								name={`${sectionPath}.title_en` as Path<TFieldValues>}
								render={({ field, fieldState }) => (
									<FormItem className='flex-1'>
										<FormLabel>{t('forms.labels.specs_section_title_en') || 'English'}</FormLabel>
										<FormControl>
											<Input
												{...field}
												value={field.value ?? ''}
												aria-invalid={!!fieldState.error}
												placeholder={
													t('forms.placeholders.specs_section_title_en') || 'e.g., Technical Specifications'
												}
											/>
										</FormControl>
										<FormMessageTranslated />
									</FormItem>
								)}
							/>
						</div>
					</div>
				) : (
					<div>
						<div className='font-semibold text-lg'>{section.title_ar || section.title_en || 'Untitled'}</div>
						<div className='text-sm text-muted-foreground'>{section.title_en}</div>
					</div>
				)}

				{/* Section Properties */}
				<div className='mt-5'>
					{section.isEditing ? (
						<FormField
							control={control}
							name={`${sectionPath}.properties` as Path<TFieldValues>}
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel>{t('forms.labels.spec_section_properties') || 'Properties'}</FormLabel>
									<FormControl>
										<SpecificationPropertiesList<TFieldValues>
											controlName={`${sectionPath}.properties` as ArrayPath<TFieldValues>}
											error={fieldState.error}
										/>
									</FormControl>
									<FormMessageTranslated />
								</FormItem>
							)}
						/>
					) : (
						<div className='space-y-2 max-h-[500px] overflow-y-auto pe-1'>
							{section.properties?.map((prop: SpecificationProperty, i: number) => (
								// <div key={prop.id || i} className='grid grid-cols-2 gap-4 p-3 rounded-md bg-secondary/30 border'>
								<div
									key={prop.id || i}
									className='grid grid-cols-1 sm:grid-cols-3 gap-2 border p-2 bg-accent/30 rounded-md'
								>
									<div className='text-sm font-medium'>{prop.key_ar || '-'}</div>
									<div className='text-sm text-muted-foreground sm:col-span-2'>{prop.value_ar || '-'}</div>
									<div className='text-sm font-medium'>{prop.key_en || '-'}</div>
									<div className='text-sm text-muted-foreground sm:col-span-2'>{prop.value_en || '-'}</div>
								</div>
								// 	{/* <div className='space-y-1'>
								// 		<div className='text-xs font-medium text-muted-foreground uppercase'>
								// 			{t('forms.labels.specs_section_title_ar') || 'Arabic'}
								// 		</div>
								// 		<div className='text-sm font-medium'>{prop.key_ar || '-'}</div>
								// 		<div className='text-sm text-muted-foreground'>{prop.value_ar || '-'}</div>
								// 	</div>
								// 	<div className='space-y-1'>
								// 		<div className='text-xs font-medium text-muted-foreground uppercase'>
								// 			{t('forms.labels.specs_section_title_en') || 'English'}
								// 		</div>
								// 		<div className='text-sm font-medium'>{prop.key_en || '-'}</div>
								// 		<div className='text-sm text-muted-foreground'>{prop.value_en || '-'}</div>
								// 	</div> */}
								// {/* </div> */}
							))}
						</div>
					)}
				</div>
			</div>

			{/* Actions */}
			<div className='flex gap-2 items-center justify-center'>
				<Button type='button' variant={section.isEditing ? 'default' : 'outline'} size='sm' onClick={toggleEdit}>
					{section.isEditing ? t('common.actions.save') || 'Save' : t('common.actions.edit') || 'Edit'}
				</Button>
				<Button type='button' variant='delete' size='sm' onClick={onRemove}>
					{t('common.actions.delete') || 'Delete'}
				</Button>
			</div>
		</div>
	);
}

'use client';
import { ReusableDNDSortable, SortableDNDWrapper } from '@/components/shard/dnd-kit-sortable';
import { Button } from '@/components/ui-custom/custom-button';
import TooltipElement from '@/components/ui-custom/tooltip-element';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpecificationProperty } from '@/server/services/product-service';
import { GripHorizontalIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useId } from 'react';
import { ArrayPath, Controller, FieldError, FieldValues, Path, useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

// =================================
// SPECIFICATION PROPERTIES LIST
// =================================
interface PropertiesListProps<TFieldValues extends FieldValues> {
	controlName: ArrayPath<TFieldValues>;
	error?: FieldError;
}

export function SpecificationPropertiesList<TFieldValues extends FieldValues>({
	controlName,
	error,
}: PropertiesListProps<TFieldValues>) {
	const { t } = useTranslation();
	const { control } = useFormContext<TFieldValues>();
	const uniqueId = useId();

	const { fields, move, append, remove } = useFieldArray({
		control,
		name: controlName, // as ArrayPath<TFieldValues>,
	});

	const handleAddProperty = () => {
		const newProperty: SpecificationProperty = {
			id: `${uniqueId}-${Date.now()}`,
			key_ar: '',
			key_en: '',
			value_ar: '',
			value_en: '',
		};
		append(newProperty as never); // as any
	};

	return (
		<ReusableDNDSortable items={fields} move={move}>
			<div className='space-y-3'>
				{fields.map((property, idx) => (
					<SortableDNDWrapper key={property.id} id={property.id}>
						{({ setNodeRef, listeners, attributes, style }) => (
							<div ref={setNodeRef} style={style} className='flex flex-col items-start gap-1 bg-muted/50 rounded-md'>
								<div className='w-full flex gap-2 items-center justify-between'>
									<div className='flex gap-2 items-center flex-1 basis-1/3'>
										<div
											{...listeners}
											{...attributes}
											className='cursor-move touch-none h-10 grid place-items-center'
										>
											<GripHorizontalIcon className='size-4' />
										</div>

										<Label htmlFor={`${controlName}.${idx}.key_ar`}>
											{t('forms.labels.spec_key') || 'property key'}
										</Label>
									</div>

									<div className='flex gap-2 items-center justify-between flex-1 basis-2/3'>
										<Label htmlFor={`${controlName}.${idx}.value_ar`}>
											{t('forms.labels.specs_value') || 'property value'}
										</Label>

										<TooltipElement content={t('common.actions.delete_property') || 'Delete property'}>
											<Button type='button' variant='delete' size='icon' onClick={() => remove(idx)}>
												<Trash2Icon className='size-4' />
											</Button>
										</TooltipElement>
									</div>
								</div>

								<div className='w-full flex-1 space-y-2'>
									{/* Arabic inputs */}
									<div className='flex gap-2'>
										<Controller
											name={`${controlName}.${idx}.key_ar` as Path<TFieldValues>}
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													value={field.value ?? ''}
													id={`${controlName}.${idx}.key_ar`}
													aria-invalid={!!error}
													placeholder={t('forms.placeholders.spec_key_ar') || 'اسم الخاصية'}
													className='flex-1 basis-1/3'
												/>
											)}
										/>

										<Controller
											name={`${controlName}.${idx}.value_ar` as Path<TFieldValues>}
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													value={field.value ?? ''}
													aria-invalid={!!error}
													placeholder={t('forms.placeholders.spec_value_ar') || 'القيمة'}
													className='flex-1 basis-2/3'
												/>
											)}
										/>
									</div>

									{/* English inputs */}
									<div className='flex gap-2'>
										<Controller
											name={`${controlName}.${idx}.key_en` as Path<TFieldValues>}
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													value={field.value ?? ''}
													aria-invalid={!!error}
													placeholder={t('forms.placeholders.spec_key_en') || 'Property name'}
													className='flex-1 basis-1/3'
												/>
											)}
										/>

										<Controller
											name={`${controlName}.${idx}.value_en` as Path<TFieldValues>}
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													value={field.value ?? ''}
													aria-invalid={!!error}
													placeholder={t('forms.placeholders.spec_value_en') || 'Value'}
													className='flex-1 basis-2/3'
												/>
											)}
										/>
									</div>
								</div>
							</div>
						)}
					</SortableDNDWrapper>
				))}

				<TooltipElement content={t('common.actions.add_property') || 'Add property'}>
					<Button type='button' size='icon' onClick={handleAddProperty}>
						<PlusIcon className='size-4' />
					</Button>
				</TooltipElement>
			</div>
		</ReusableDNDSortable>
	);
}

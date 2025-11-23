import { ReusableDNDSortable, SortableDNDWrapper } from '@/components/shard/dnd-kit-sortable';
import { Button } from '@/components/ui-custom/custom-button';
import { Checkbox } from '@/components/ui-custom/custom-checkbox';
import TooltipElement from '@/components/ui-custom/tooltip-element';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripHorizontalIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { ArrayPath, Controller, FieldError, useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ProductVariantsForm, VariantOption } from './types';
import { generateId } from './utils';

// =================================
// VARIANT OPTIONS LIST
// =================================

export default function VariantOptionsList({ controlName, error }: { controlName: string; error?: FieldError }) {
	const { t } = useTranslation();
	const { control } = useFormContext<ProductVariantsForm>();
	const { fields, move, append, remove } = useFieldArray({
		control,
		name: controlName as ArrayPath<ProductVariantsForm>,
	});

	const [isColors, setIsColors] = useState(fields?.some((option) => (option as VariantOption).colorHex));

	return (
		<ReusableDNDSortable items={fields} move={move}>
			<div className='space-y-2'>
				<div className='flex gap-2 items-center'>
					<Checkbox id='for-colors' checked={isColors} onCheckedChange={(checked) => setIsColors(!!checked)} />
					<Label htmlFor='for-colors'>{t('forms.labels.add_color_code')}</Label>
				</div>

				{fields.map((opt, idx) => (
					<SortableDNDWrapper key={opt.id} id={opt.id}>
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
					</SortableDNDWrapper>
				))}

				<TooltipElement content={t('common.actions.add_option') || 'Add option'}>
					<Button type='button' size='icon' onClick={() => append({ id: generateId(), value_ar: '', value_en: '' })}>
						<PlusIcon className='size-4' />
					</Button>
				</TooltipElement>
			</div>
		</ReusableDNDSortable>
	);
}

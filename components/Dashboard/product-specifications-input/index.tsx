'use client';
import { ReusableDNDSortable, SortableDNDWrapper } from '@/components/shard/dnd-kit-sortable';
import { Button } from '@/components/ui-custom/custom-button';
import { GripIcon, PlusIcon, TablePropertiesIcon } from 'lucide-react';
import { useId } from 'react';
import { ArrayPath, FieldValues, Path, useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SpecificationSectionEditor } from './specifications-section-editor';
import { SpecificationSectionFront } from './utils';

// =================================
// MAIN SPECIFICATIONS LIST
// =================================
interface SpecificationsListProps<TFieldValues extends FieldValues> {
	fieldName?: Path<TFieldValues>;
	defaultValue?: SpecificationSectionFront[];
}

export default function SpecificationsList<TFieldValues extends FieldValues>({
	fieldName = 'specifications' as Path<TFieldValues>,
	defaultValue,
}: SpecificationsListProps<TFieldValues> = {}) {
	const { t } = useTranslation();
	const { control, setValue } = useFormContext<TFieldValues>();
	const uniqueId = useId();

	const { fields, move, append, remove } = useFieldArray({
		control,
		name: fieldName as ArrayPath<TFieldValues>,
	});

	// Set default value only once if provided
	const hasInitialized = fields.length > 0;
	if (defaultValue && !hasInitialized && defaultValue.length > 0) {
		setValue(fieldName, defaultValue as any);
	}

	const handleAddSection = () => {
		const newSection: SpecificationSectionFront = {
			id: `${uniqueId}-${Date.now()}`,
			title_ar: '',
			title_en: '',
			properties: [{ id: `${uniqueId}-prop-${Date.now()}`, key_ar: '', key_en: '', value_ar: '', value_en: '' }],
			isEditing: true,
		};
		append(newSection as any);
	};

	return (
		<div className='grid gap-2'>
			{/* <div className='flex items-center justify-between'>
				<Label htmlFor='product-add_specifications' className='text-lg font-semibold'>
					{t('forms.labels.product_specifications') || 'Product Specifications'}
				</Label>
			</div> */}

			{fields.length === 0 ? (
				<div className='border-2 border-dashed rounded-lg p-12 text-center'>
					<div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
						<TablePropertiesIcon className='w-8 h-8 text-muted-foreground' />
					</div>
					<h3 className='text-lg font-semibold mb-2'>
						{t('forms.placeholders.no_specifications') || 'No specifications yet.'}
					</h3>
					<p className='text-sm text-muted-foreground mb-6 max-w-md mx-auto'>
						{t('forms.descriptions.add_specifications') ||
							'Add product specifications to help customers understand your product better.'}
					</p>
					<Button type='button' id='product-add_specifications' onClick={handleAddSection}>
						<PlusIcon className='size-4 mr-2' />
						{t('common.actions.add_specifications') || 'Add Your First Specification'}
					</Button>
				</div>
			) : (
				<ReusableDNDSortable items={fields} move={move}>
					<div className='flex flex-col gap-3 border rounded-lg p-2 sm:p-3 mb-3'>
						{fields.map((section, idx) => (
							<SortableDNDWrapper key={section.id} id={section.id}>
								{({ setNodeRef, listeners, attributes, style }) => (
									<div
										ref={setNodeRef}
										style={style}
										className='flex-1 border rounded-md bg-muted/50 p-2 sm:p-3 flex gap-3 flex-col sm:flex-row'
									>
										<div {...listeners} {...attributes} className='cursor-move touch-none pt-2'>
											<GripIcon className='size-5 text-muted-foreground' />
										</div>
										<div className='flex-1'>
											<SpecificationSectionEditor<TFieldValues>
												index={idx}
												onRemove={() => remove(idx)}
												fieldName={fieldName}
											/>
										</div>
									</div>
								)}
							</SortableDNDWrapper>
						))}

						<div className='flex justify-end'>
							<Button type='button' id='product-add_specifications' onClick={handleAddSection}>
								<PlusIcon className='size-4 mr-2' />
								{t('common.actions.add_more') || 'Add more'}
							</Button>
						</div>
					</div>
				</ReusableDNDSortable>
			)}
		</div>
	);
}

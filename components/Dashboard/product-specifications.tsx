'use client';
import { Button } from '@/components/ui-custom/custom-button';
import TooltipElement from '@/components/ui-custom/tooltip-element';
import { Input } from '@/components/ui/input';
import { SpecificationProperty, SpecificationSection } from '@/server/services/product-service';
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
import { GripHorizontalIcon, GripIcon, PlusIcon, TablePropertiesIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useId } from 'react';
import {
	ArrayPath,
	Controller,
	FieldError,
	FieldValues,
	Path,
	useFieldArray,
	useFormContext,
	useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormControl, FormField, FormItem, FormLabel, FormMessageTranslated } from '../ui-custom/custom-form';
import { Label } from '../ui/label';

export interface SpecificationSectionFront extends SpecificationSection {
	isEditing: boolean;
}

// Helper function to transform data from backend
export function transformSpecificationsFromBackend(backendSpecs: SpecificationSection[]): SpecificationSectionFront[] {
	return backendSpecs.map((spec) => ({
		id: spec.id,
		title_ar: spec.title_ar,
		title_en: spec.title_en,
		properties: spec.properties.map((prop) => ({
			id: prop.id,
			key_ar: prop.key_ar,
			key_en: prop.key_en,
			value_ar: prop.value_ar,
			value_en: prop.value_en,
		})),
		isEditing: false,
	}));
}

export function transformSpecificationsToBackend(specifications: SpecificationSectionFront[]): SpecificationSection[] {
	return specifications
		.map((section) => {
			// Clean properties
			const cleanedProperties = section.properties
				.filter((prop) => {
					const hasKey = prop.key_ar?.trim() || prop.key_en?.trim();
					const hasValue = prop.value_ar?.trim() || prop.value_en?.trim();
					return hasKey && hasValue;
				})
				.map((prop) => ({
					id: prop.id,
					key_ar: prop.key_ar?.trim() || '',
					key_en: prop.key_en?.trim() || '',
					value_ar: prop.value_ar?.trim() || '',
					value_en: prop.value_en?.trim() || '',
				}));

			return {
				id: section.id,
				title_ar: section.title_ar?.trim() || '',
				title_en: section.title_en?.trim() || '',
				properties: cleanedProperties,
			};
		})
		.filter((section) => section.properties.length > 0);
}

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
		name: controlName as ArrayPath<TFieldValues>,
	});

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
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
			<SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
				<div className='space-y-3'>
					{fields.map((property, idx) => (
						<SortableWrapper key={property.id} id={property.id}>
							{({ setNodeRef, listeners, attributes, style }) => (
								<div
									ref={setNodeRef}
									style={style}
									className='flex flex-col items-start gap-1 bg-muted/50 rounded-md'
								>
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
						</SortableWrapper>
					))}

					<TooltipElement content={t('common.actions.add_property') || 'Add property'}>
						<Button type='button' size='icon' onClick={handleAddProperty}>
							<PlusIcon className='size-4' />
						</Button>
					</TooltipElement>
				</div>
			</SortableContext>
		</DndContext>
	);
}

// =================================
// SECTION EDITOR
// =================================
interface SectionEditorProps<TFieldValues extends FieldValues> {
	index: number;
	onRemove: () => void;
	fieldName?: Path<TFieldValues>;
}

export function SpecificationSectionFrontEditor<TFieldValues extends FieldValues>({
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
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
					<SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
						<div className='flex flex-col gap-3 border rounded-lg p-2 sm:p-3 mb-3'>
							{fields.map((section, idx) => (
								<SortableWrapper key={section.id} id={section.id}>
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
												<SpecificationSectionFrontEditor<TFieldValues>
													index={idx}
													onRemove={() => remove(idx)}
													fieldName={fieldName}
												/>
											</div>
										</div>
									)}
								</SortableWrapper>
							))}

							<div className='flex justify-end'>
								<Button type='button' id='product-add_specifications' onClick={handleAddSection}>
									<PlusIcon className='size-4 mr-2' />
									{t('common.actions.add_more') || 'Add more'}
								</Button>
							</div>
						</div>
					</SortableContext>
				</DndContext>
			)}
		</div>
	);
}

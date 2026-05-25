import { EnumDatePickerMode } from '@/components/inputs/multi-date-picker';
import { ComboboxOption, PaginatedResponse } from '@/components/ui-custom/reuseable-combobox';
import { TImage } from '@/types/api.js';
import { ChangeEvent, ComponentType, ElementType, ReactNode } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

// ============================================================================
// 1. FIELD TYPE UNION DEFINITIONS
// ============================================================================

export type FieldTypeMap =
	// Base Field Types
	| 'text'
	| 'textarea'
	| 'number'
	| 'email'
	| 'tel'
	| 'url'
	| 'date'
	| 'time'
	| 'datetime'
	| 'empty'
	| 'switch'
	| 'checkbox'
	| 'radio'

	// Special Field Types
	| 'password'
	| 'richtext'
	| 'combobox'
	| 'otp'
	| 'uploadFile'
	| 'slug'
	| 'selectFiled'
	| 'productVariants'
	| 'SpecificationsList'
	| 'attributes'
	| 'imageManager'
	| 'imageUpload'
	| 'multiDatePicker'
	| 'seoMockupCard'
	| 'shardPostMockupCard';

export type FieldType = FieldTypeMap;

// ============================================================================
// 2. DISCRIMINATED UNION CONFIGURATIONS (Enterprise-Grade Architecture)
// ============================================================================

// Base configuration context inherited by all specialized field components
export interface BaseFieldConfig<T extends FieldValues, K extends FieldType> {
	type: K;
	name: Path<T>;
	label?: string;
	placeholder?: string;
	description?: string;
	required?: boolean;
	IconStart?: ElementType;
	IconEnd?: string | ElementType;
	InfoIcon?: ElementType;
	infoContent?: string | ReactNode;
	class?: string;
	parentClass?: string;
	locale?: string;
	referenceInput?: string;
	searchPlaceholder?: string;
	emptyMessage?: string | ReactNode;
	onChange?: (event: ChangeEvent<HTMLInputElement>, form: UseFormReturn<T>) => void;
}

// Dedicated context structure constraints for Textarea nodes
export interface TextareaFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'textarea'> {
	rows?: number;
}

// Dedicated context structure constraints for Switch nodes
export interface SwitchFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'switch'> {
	variants?: 'input' | 'switch';
}

// Dedicated context structure constraints for Checkbox elements
interface CheckboxFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'checkbox'> {
	items?: { name: string; label: string; checked: boolean }[];
}

export interface RichTextFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'richtext'> {
	type: 'richtext';
}

// Dedicated context structure constraints for standard File upload utilities
interface UploadFileFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'uploadFile'> {
	file?: {
		accept?: string;
		maxSize?: number;
		multiple?: boolean;
	};
	multiple?: boolean;
}

// Dedicated context structure constraints for specialized Image Manager interfaces
export interface ImageManagerFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'imageManager'> {
	folder?: string;
	multiple?: boolean;
}

// Dedicated context structure constraints for classic Select dropdowns
interface SelectFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'selectFiled'> {
	noneItem?: string | boolean;
	sectorProperty_1?: string;
	sectorProperty_2?: string;
	options?: { id?: string; label: string; value: string }[];
	fetchItems?: () => Promise<{ label: string; value: string }[]>;
}

export interface FileInputFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'uploadFile'> {
	type: 'uploadFile';
	file?: {
		accept?: string;
		maxSize?: number;
		multiple?: boolean;
	};
	infoContent?: string;
	InfoIcon?: React.ComponentType<{ className?: string }>;
}

// Dedicated context structure constraints for Advanced Paginated Combobox units
// interface ComboboxFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'combobox'> {
// 	optionUrl?: string;
// 	revalidateTags?: string[];
// 	isTags?: boolean;
// 	isProducts?: boolean;
// 	returnObject?: boolean;
// 	linkHref?: string;
// 	deleteTag?: (id: string) => Promise<void>;
// 	fetchOptions?: (
// 		query: string,
// 		page?: number,
// 	) => Promise<PaginatedResponse<T extends ComboboxOption ? T : ComboboxOption>>;
// 	customColumn?: (option: T extends ComboboxOption ? T : ComboboxOption) => ReactNode;
// }

export interface ComboboxFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'combobox'> {
	type: 'combobox';

	// properties for fetch data (either direct link or custom fetch function)
	optionUrl?: string;
	fetchOptions?: (
		query: string,
		page?: number,
	) => Promise<PaginatedResponse<T extends ComboboxOption ? T : ComboboxOption>>;

	// properties for revalidation
	revalidateTags?: string[];

	// properties for rendering and additional actions
	isTags?: boolean;
	isProducts?: boolean;
	multiple?: boolean;
	returnObject?: boolean;
	linkHref?: string;

	// passed functions for custom actions
	deleteTag?: (id: string) => Promise<void>;
	customColumn?: (option: T extends ComboboxOption ? T : ComboboxOption) => ReactNode;
	initialItems?: ComboboxOption[];
}

export interface ImageUploadFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'imageUpload'> {
	type: 'imageUpload';
	multiple?: boolean;
	folder?: string;
	accept?: string;
	maxSize?: number;
}

// Dedicated context structure constraints for Matrix Variant controllers
export interface ProductVariantsFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'productVariants'> {
	attributesName?: string;
	skuName?: string;
}

// Dedicated context structure constraints for Dynamic Calendar Picker setups
export interface MultiDatePickerFieldConfig<T extends FieldValues> extends BaseFieldConfig<T, 'multiDatePicker'> {
	datePickerMode?: EnumDatePickerMode;
	inputClass?: string;
	timePicker?: boolean;
	dateOptions?: {
		minDate?: string;
		maxDate?: string;
		disabledDates?: string[];
		onlyAllowedDates?: string[];
	};
}

// Fallback pattern capturing all standard input configs requiring zero extra attributes
interface StandardFieldConfig<T extends FieldValues> extends BaseFieldConfig<
	T,
	Exclude<
		FieldType,
		| 'textarea'
		| 'switch'
		| 'checkbox'
		| 'uploadFile'
		| 'imageManager'
		| 'selectFiled'
		| 'combobox'
		| 'productVariants'
		| 'multiDatePicker'
	>
> {}

// Core Discriminated Union type distribution layer
export type FieldConfig<T extends FieldValues = FieldValues, K extends FieldType = FieldType> = Extract<
	| StandardFieldConfig<T>
	| TextareaFieldConfig<T>
	| SwitchFieldConfig<T>
	| CheckboxFieldConfig<T>
	| UploadFileFieldConfig<T>
	| ImageManagerFieldConfig<T>
	| SelectFieldConfig<T>
	| ComboboxFieldConfig<T>
	| ProductVariantsFieldConfig<T>
	| MultiDatePickerFieldConfig<T>
	|ImageUploadFieldConfig<T>,
	{ type: K }
>;

// ============================================================================
// 3. PROP CONTRACTS & REGISTRY MAP BLUEPRINTS
// ============================================================================

export interface RenderFieldProps<T extends FieldValues, K extends FieldTypeMap> {
	fieldConfig: FieldConfig<T, K>;
	form: UseFormReturn<T>;
}

export type SectionConfig<T extends FieldValues = FieldValues> = {
	title?: string;
	fields: FieldConfig<T, FieldType>[];
};

// export type InputRegistryType<T extends FieldValues> = {
// 	[K in FieldTypeMap]?: (props: RenderFieldProps<T, K>) => React.JSX.Element;
// };

export type InputRegistryType<T extends FieldValues> = {
	[K in FieldTypeMap]?: ComponentType<RenderFieldProps<T, K>>;
};
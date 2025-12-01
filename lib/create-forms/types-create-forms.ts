import { EnumDatePickerMode } from '@/components/inputs/multi-date-picker';
import { ComboboxOption, PaginatedResponse } from '@/components/ui-custom/reuseable-combobox';
import { ChangeEvent, ElementType, ReactNode } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

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

// export type FieldTypeMap = {
// 	// Base Field Types
// 	text: string;
// 	textarea: string;
// 	number: number;
// 	email: string;
// 	tel: string;
// 	url: string;
// 	date: string;
// 	time: string;
// 	datetime: string;

// 	empty: string;

// 	switch: boolean;
// 	checkbox: boolean;
// 	radio: boolean;

// 	// Special Field Types
// 	password: string;
// 	richtext: string;
// 	combobox: string | string[] | number;
// 	otp: string;
// 	uploadFile: File | File[] | null;
// 	slug: string;

// 	productVariants: string;
// 	attributes: string;

// 	imageManager: File | File[] | null;
// 	imageUpload: string | string[] | null;
// 	seoMockupCard: never;
// 	shardPostMockupCard: never;
// };

export type FieldType = FieldTypeMap;

export interface FieldConfig<T extends FieldValues = FieldValues, K extends FieldType = FieldType> {
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
	// for textarea
	rows?: number;

	class?: string;
	parentClass?: string;
	onChange?: (event: ChangeEvent<HTMLInputElement>, form: UseFormReturn<T>) => void;

	// for switch
	variants?: 'input' | 'switch';

	// for checkbox
	items?: { name: string; label: string; checked: boolean }[];

	locale?: string;
	referenceInput?: string;

	file?: {
		accept?: string;
		maxSize?: number;
		multiple?: boolean;
	};
	multiple?: boolean;
	folder?: string; // for ImageManager upload folder name

	// only for special field types that need additional data
	options?: { id?: string; label: string; value: string }[];
	fetchItems?: () => Promise<{ label: string; value: string }[]>;

	// select field
	noneItem?: string | boolean;
	sectorProperty_1?: string;
	sectorProperty_2?: string;

	// combobox component
	fetchOptions?: (
		query: string,
		page?: number
	) => Promise<PaginatedResponse<T extends ComboboxOption ? T : ComboboxOption>>;
	optionUrl?: string;
	revalidateTags?: string[];
	isTags?: boolean;
	isProducts?: boolean;
	deleteTag?: (id: string) => Promise<void>;
	returnObject?: boolean;
	// getOptionFn;

	// productVariants
	attributesName?: string;
	skuName?: string;

	searchPlaceholder?: string;
	emptyMessage?: string | ReactNode;

	// multi date picker
	// DateMode?: 'date' | 'datetime' | 'time';
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

export interface RenderFieldProps<T extends FieldValues, K extends FieldTypeMap> {
	fieldConfig: FieldConfig<T, K>;
	form: UseFormReturn<T>;
}

export type SectionConfig<T extends FieldValues = FieldValues> = {
	title?: string;
	fields: FieldConfig<T>[];
};

// export type InputRegistry = {
// 	[K in FieldTypeMap]?: <T extends FieldValues>(props: RenderFieldProps<T, K>) => JSX.Element;
// };

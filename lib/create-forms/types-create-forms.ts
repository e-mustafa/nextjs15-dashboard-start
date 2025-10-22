import { ComboboxOption, PaginatedResponse } from '@/components/ui-custom/reuseable-combobox';
import { ChangeEvent, ElementType, ReactNode } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

export type FieldTypeMap = {
	// Base Field Types
	text: string;
	textarea: string;
	number: number;
	email: string;
	tel: string;
	url: string;
	date: string;
	time: string;

	// Special Field Types
	password: string;
	richtext: string;
	combobox: string | string[] | number;
	otp: string;
	uploadFile: File | File[] | null;
	slug: string;

	imageManager: File | File[] | null;
	imageUpload: string | string[] | null;
	seoMockupCard: never;
};

export type FieldType = keyof FieldTypeMap;

export interface FieldConfig<T extends FieldValues = FieldValues, K extends FieldType = FieldType> {
	type: K;
	name: Path<T>;
	label?: string;
	placeholder?: string;
	description?: string;
	required?: boolean;
	IconStart?: ElementType;
	IconEnd?: ElementType;
	InfoIcon?: ElementType;
	infoContent?: string | ReactNode;
	// for textarea
	rows?: number;

	parentClass?: string;
	onChange?: (event: ChangeEvent<HTMLInputElement>, form: UseFormReturn<T>) => void;

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
	options?: { label: string; value: string }[];
	fetchItems?: () => Promise<{ label: string; value: string }[]>;

	// combobox component
	fetchOptions?: (query: string, page?: number) => Promise<PaginatedResponse<T extends ComboboxOption ? T : ComboboxOption>>;
	optionUrl?: string;
	// getOptionFn;

	searchPlaceholder?: string;
	emptyMessage?: string | ReactNode;
}

export interface RenderFieldProps<T extends FieldValues, K extends keyof FieldTypeMap> {
	fieldConfig: FieldConfig<T, K>;
	form: UseFormReturn<T>;
}

export type SectionConfig<T extends FieldValues = FieldValues> = {
	title: string;
	fields: FieldConfig<T>[];
};

// export type InputRegistry = {
// 	[K in keyof FieldTypeMap]?: <T extends FieldValues>(props: RenderFieldProps<T, K>) => JSX.Element;
// };

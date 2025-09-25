import { ChangeEvent, ElementType, ReactNode } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

export type FieldTypeMap = {
	// Base Field Types
	text: string;
	number: number;
	email: string;
	tel: string;
	url: string;
	date: string;
	time: string;

	// Special Field Types
	password: string;
	richtext: string;
	combobox: string | number;
	otp: string;
	uploadFile: File | File[] | null;
	slug: string;

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

	parentClass?: string;
	onChange?: (event: ChangeEvent<HTMLInputElement>, form: UseFormReturn<T>) => void;

	locale?: string;
	referenceInput?: string;

	file?: {
		accept?: string;
		maxSize?: number;
		multiple?: boolean;
	};

	// only for special field types that need additional data
	options?: { label: string; value: string }[];
	fetchItems?: () => Promise<{ label: string; value: string }[]>;
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

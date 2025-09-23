// import { ComponentType, ReactNode } from 'react';
// import { FieldValues, UseFormReturn } from 'react-hook-form';

// export type BaseFieldTypes = 'text' | 'number' | 'email' | 'tel' | 'url' | 'date' | 'time';

// export type SpecialFieldTypes = 'password' | 'combobox' | 'otp' | 'hijriDate' | 'richtext' | 'seoMockupCard';

// export type FieldType = BaseFieldTypes | SpecialFieldTypes;

// export interface FieldConfig<T extends FieldValues = FieldValues> {
// 	type: FieldType;
// 	name: keyof T & string;
// 	label?: string;
// 	placeholder?: string;
// 	description?: string;
// 	required?: boolean;
// 	parentClass?: string;
// 	iconStart?: ComponentType | ReactNode;
// 	iconEnd?: ComponentType | ReactNode;
// 	/** only for special field types that need additional data */
// 	options?: { label: string; value: string }[];
// 	fetchItems?: () => Promise<{ label: string; value: string }[]>;
// }

// export type SectionConfig = {
// 	title: string;
// 	fields: FieldConfig[];
// };
// // export interface RenderFieldProps<T extends FieldValues = FieldValues> {
// // 	fieldConfig: FieldConfig<T & FieldValues>;
// // 	form: UseFormReturn<T & FieldValues>;
// // }

// export type RenderFieldProps<T extends FieldValues = FieldValues> = {
// 	fieldConfig: FieldConfig<T>;
// 	form: UseFormReturn<T>;
// };

// // export type RenderField<T extends FieldValues = FieldValues> = (props: RenderFieldProps<T>) => ReactNode;

import { ComponentType, ReactNode } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

export type FieldTypeMap = {
	text: string;
	number: number;
	email: string;
	tel: string;
	url: string;
	date: string;
	time: string;
	password: string;
	richtext: string;
	seoMockupCard: never; // ما يستقبل value مباشر
};

export type BaseFieldTypes = 'text' | 'number' | 'email' | 'tel' | 'url' | 'date' | 'time';

export type SpecialFieldTypes = 'password' | 'richtext' | 'seoMockupCard';

export type FieldType = BaseFieldTypes | SpecialFieldTypes;

export interface FieldConfig<T extends FieldValues = FieldValues> {
	type: FieldType;
	name: Path<T>;
	label?: string;
	placeholder?: string;
	description?: string;
	required?: boolean;
	iconStart?: ComponentType | ReactNode;
	iconEnd?: ComponentType | ReactNode;
}

export interface RenderFieldProps<T extends FieldValues = FieldValues> {
	fieldConfig: FieldConfig<T>;
	form: UseFormReturn<T>;
}



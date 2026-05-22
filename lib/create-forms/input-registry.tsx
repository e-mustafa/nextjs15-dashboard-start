'use client';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';
import { FieldValues } from 'react-hook-form';
import { FieldTypeMap, InputRegistryType, RenderFieldProps } from './types-create-forms';

// Import Static Components directly
import seoMockupField from '@/components/Dashboard/seo-mockup-field';
import SharedPostMockupField from '@/components/Dashboard/shared-post-mockup-field';
import CheckboxInputField from '@/components/inputs/checkbox-input-field';
import PasswordInput from '@/components/inputs/password-input';
import SelectField from '@/components/inputs/select-field';
import SlugInputField from '@/components/inputs/slug-input-field';
import SwitchInputField from '@/components/inputs/switch-input-field';
import TextareaInputField from '@/components/inputs/textarea-input-field';
import BaseInputField from './base-input-field';

// ============================================================================
// 1. DYNAMIC IMPORTS
// ============================================================================

const MultiDatePickerField = dynamic(() => import('@/components/inputs/multi-date-picker-field'), {
	ssr: false,
	loading: () => <Input className='animate-pulse' placeholder='Loading calendar...' />,
});

const ComboboxInputField = dynamic(() => import('@/components/inputs/combobox-input-field'), {
	ssr: false,
	loading: () => <Input className='animate-pulse' placeholder='Loading combobox...' />,
});

const RichTextField = dynamic(() => import('@/components/inputs/rich-text-field'), {
	ssr: false,
	loading: () => <div className='h-40 w-full animate-pulse rounded-md bg-muted' />,
});

const FileInputField = dynamic(() => import('@/components/inputs/file-input-field'), {
	ssr: false,
	loading: () => <div className='h-40 w-full animate-pulse rounded-md bg-muted' />,
});

const ImageUploadField = dynamic(() => import('@/components/inputs/image-upload-field'), {
	ssr: false,
	loading: () => <div className='h-40 w-full animate-pulse rounded-md bg-muted' />,
});

const ProductVariantsField = dynamic(() => import('@/components/inputs/product-variants-field'), {
	ssr: false,
	loading: () => <div className='h-40 w-full animate-pulse rounded-md bg-muted' />,
});

const SpecificationsListField = dynamic(() => import('@/components/inputs/specifications-list-field'), {
	ssr: false,
	loading: () => <div className='h-40 w-full animate-pulse rounded-md bg-muted' />,
});

// ============================================================================
// 2. THE REGISTRY FACTORY CONSTRUCTOR
// Using Type Assertion (as ComponentType<...>) directly inline.
// This is a Zero-Runtime-Cost solution that fixes generic loss perfectly.
// ============================================================================

export function getInputRegistry<T extends FieldValues>(): InputRegistryType<T> {
	return {
		// Static components mapping references directly
		password: PasswordInput,
		textarea: TextareaInputField,
		switch: SwitchInputField,
		checkbox: CheckboxInputField,
		slug: SlugInputField,
		selectFiled: SelectField,

		// Placeholder empty layout box
		empty: () => <div />,

		// Dynamic components mapped with strict generic Type Assertions
		multiDatePicker: MultiDatePickerField as ComponentType<RenderFieldProps<T, 'multiDatePicker'>>,
		combobox: ComboboxInputField as ComponentType<RenderFieldProps<T, 'combobox'>>,
		richtext: RichTextField as ComponentType<RenderFieldProps<T, 'richtext'>>,
		uploadFile: FileInputField as ComponentType<RenderFieldProps<T, 'uploadFile'>>,

		imageUpload: ImageUploadField as ComponentType<RenderFieldProps<T, 'imageUpload'>>,
		productVariants: ProductVariantsField as ComponentType<RenderFieldProps<T, 'productVariants'>>,
		SpecificationsList: SpecificationsListField as ComponentType<RenderFieldProps<T, 'SpecificationsList'>>,

		// Highly customized inline complex mockup cards
		seoMockupCard: seoMockupField,
		shardPostMockupCard: SharedPostMockupField,
	};
}

// ============================================================================
// 3. FIELD RENDERING ENGINE
// ============================================================================

export function renderField<T extends FieldValues, K extends FieldTypeMap>(
	props: RenderFieldProps<T, K>,
): React.JSX.Element {
	const registry = getInputRegistry<T>();
	const Renderer = registry[props.fieldConfig.type];

	if (Renderer) {
		const TargetedRenderer = Renderer as ComponentType<RenderFieldProps<T, K>>;
		return <TargetedRenderer {...props} />;
	}

	return <BaseInputField {...props} />;
}

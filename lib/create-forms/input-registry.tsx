import SEOMockupCard from '@/components/Dashboard/seo-mockup';
import { ComboboxInputField } from '@/components/inputs/combobox-input-field';
import { FileInputField } from '@/components/inputs/file-input-field';
import ImageUploadField from '@/components/inputs/image-upload-field';
import PasswordInput from '@/components/inputs/password-input';
import RichTextField from '@/components/inputs/rich-text-field';
import SlugInputField from '@/components/inputs/slug-input-field';
import ShardPostMockupCard from '@/components/Dashboard/shared-post-mockup';
import SwitchInputField from '@/components/inputs/switch-input-field';
import TextareaInputField from '@/components/inputs/textarea-input-field';
import { JSX } from 'react';
import { FieldValues, Path } from 'react-hook-form';
import BaseInputField from './base-input-field';
import { FieldTypeMap, RenderFieldProps } from './types-create-forms';
import CheckboxInputField from '@/components/inputs/checkbox-input-field';

/**
 * A registry mapping input field types to their corresponding render functions.
 * Each function receives field configuration and form context, and returns a React element
 * for rendering the specific input type.
 *
 * Supported input types:
 * - `password`: Renders a password input field.
 * - `richtext`: Renders a rich text editor input field.
 * - `seoMockupCard`: Renders an SEO mockup card using form values for Arabic and English SEO fields.
 *
 * @template T - The type of form field values.
 */

type InputRegistry = {
	[K in keyof FieldTypeMap]?: <T extends FieldValues>(props: RenderFieldProps<T, K>) => JSX.Element;
};

export const inputRegistry: InputRegistry = {

	password: ({ fieldConfig, form }) => <PasswordInput fieldConfig={fieldConfig} form={form} />,
	textarea: ({ fieldConfig, form }) => <TextareaInputField fieldConfig={fieldConfig} form={form} />,

	empty: () => <div />,

	switch: ({ fieldConfig, form }) => <SwitchInputField fieldConfig={fieldConfig} form={form} />,
	checkbox: ({ fieldConfig, form }) => <CheckboxInputField fieldConfig={fieldConfig} form={form} />,

	slug: ({ fieldConfig, form }) => <SlugInputField fieldConfig={fieldConfig} form={form} />,

	uploadFile: ({ fieldConfig, form }) => <FileInputField fieldConfig={fieldConfig} form={form} />,
	imageUpload: ({ fieldConfig, form }) => <ImageUploadField fieldConfig={fieldConfig} form={form} />,

	richtext: ({ fieldConfig, form }) => <RichTextField fieldConfig={fieldConfig} form={form} />,

	combobox: ({ fieldConfig, form }) => <ComboboxInputField fieldConfig={fieldConfig} form={form} />,

	seoMockupCard: <T extends FieldValues>({ form }: RenderFieldProps<T, 'seoMockupCard'>) => {
		const data = {
			ar: {
				title: form.watch('seoTitle_ar' as Path<T>),
				description: form.watch('seoDescription_ar' as Path<T>),
				slug: form.watch('slug_ar' as Path<T>),
			},
			en: {
				title: form.watch('seoTitle_en' as Path<T>),
				description: form.watch('seoDescription_en' as Path<T>),
				slug: form.watch('slug_en' as Path<T>),
			},
		};
		const image = form.watch('seoImage' as Path<T>)?.[0]?.url || form.watch('images' as Path<T>)?.[0]?.url;
		return <SEOMockupCard data={data} image={image} />;
	},

	shardPostMockupCard: <T extends FieldValues>({ form }: RenderFieldProps<T, 'shardPostMockupCard'>) => {
		const data = {
			ar: {
				title: form.watch('seoTitle_ar' as Path<T>),
				description: form.watch('seoDescription_ar' as Path<T>),
				slug: form.watch('slug_ar' as Path<T>),
			},
			en: {
				title: form.watch('seoTitle_en' as Path<T>),
				description: form.watch('seoDescription_en' as Path<T>),
				slug: form.watch('slug_en' as Path<T>),
			},
		};
		const image = form.watch('seoImage' as Path<T>)?.[0]?.url || form.watch('images' as Path<T>)?.[0]?.url;
		return <ShardPostMockupCard data={data} image={image} />;
	},
};


/**
 * This function renders a field based on the type of the field and the props passed in.
 *
 * @param {RenderFieldProps<T, K>} props - The props passed in from the useForm hook.
 * @returns {JSX.Element} - The rendered field component.
 */

export function renderField<T extends FieldValues, K extends keyof FieldTypeMap>(
	props: RenderFieldProps<T, K>
): JSX.Element {
	const renderer = inputRegistry[props.fieldConfig.type] as ((props: RenderFieldProps<T, K>) => JSX.Element) | undefined;

	if (renderer) {
		return renderer(props);
	}
	return <BaseInputField {...props} />;
}

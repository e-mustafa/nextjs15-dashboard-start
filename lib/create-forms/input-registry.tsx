import SEOMockupCard from '@/components/Dashboard/seo-mockup';
import { FileInputField } from '@/components/inputs/file-input-field';
import ImageUploadField from '@/components/inputs/image-upload-field';
import PasswordInput from '@/components/inputs/password-input';
import RichTextField from '@/components/inputs/rich-text-field';
import SlugInputField from '@/components/inputs/slug-input-field';
import { JSX } from 'react';
import { FieldValues, Path } from 'react-hook-form';
import BaseInputField from './base-input-field';
import { FieldTypeMap, RenderFieldProps } from './types-create-forms';

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
	// password: <T extends FieldValues>({ fieldConfig, form }: RenderFieldProps<T, 'password'>) => (
	// 	<PasswordInput fieldConfig={fieldConfig} form={form as UseFormReturn<FieldValues>} />
	// ),

	password: ({ fieldConfig, form }) => <PasswordInput fieldConfig={fieldConfig} form={form} />,
	// password: ({ fieldConfig, form }) => <PasswordInput fieldConfig={fieldConfig} form={form} />,

	// uploadFile: <T extends FieldValues>({ fieldConfig, form }: RenderFieldProps<T, 'uploadFile'>) => (
	// 	<FileInputField fieldConfig={fieldConfig} form={form} />
	// ),

	slug: ({ fieldConfig, form }) => <SlugInputField fieldConfig={fieldConfig} form={form} />,

	uploadFile: ({ fieldConfig, form }) => <FileInputField fieldConfig={fieldConfig} form={form} />,
	// imageManager: ({ fieldConfig, form }) => <ImageManagerField fieldConfig={fieldConfig} form={form} />,
	imageUpload: ({ fieldConfig, form }) => <ImageUploadField fieldConfig={fieldConfig} form={form} />,

	richtext: ({ fieldConfig, form }) => <RichTextField fieldConfig={fieldConfig} form={form} />,

	seoMockupCard: <T extends FieldValues>({ form }: RenderFieldProps<T, 'seoMockupCard'>) => {
		const data = {
			ar: {
				title: form.watch('seo_title_ar' as Path<T>),
				description: form.watch('seo_description_ar' as Path<T>),
				link: form.watch('seo_link' as Path<T>),
			},
			en: {
				title: form.watch('seo_title_en' as Path<T>),
				description: form.watch('seo_description_en' as Path<T>),
				link: form.watch('seo_link' as Path<T>),
			},
		};
		return <SEOMockupCard data={data} />;
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

// export function renderField<T extends FieldValues, K extends keyof FieldTypeMap>(
// 	props: RenderFieldProps<T, K>
// ): JSX.Element {
// 	const renderer = inputRegistry[props.fieldConfig.type] as InputRegistry[K] | undefined;

// 	if (renderer) {
// 		return renderer(props);
// 	}

// 	return <BaseInputField {...props} />;
// }

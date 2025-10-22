'use client';

import { url_segment } from '@/app/[locale]/dashboard/(products-management)/categories/page';
import LoaderInstElement from '@/components/shard/loaders/loader-inst-element';
import { Form } from '@/components/ui-custom/custom-form';
import { config_env } from '@/configs/general';
import { useFormResponse } from '@/hooks/use-form-response';
import { useServerResponse } from '@/hooks/use-server-response';
import { renderField } from '@/lib/create-forms/input-registry';
import { SectionConfig } from '@/lib/create-forms/types-create-forms';
import { msg } from '@/lib/utils';
import { createCategoryAction, updateCategoryAction } from '@/server/actions/category-actions';
import { ActionResult } from '@/types/api';
import { defaultValues_category, formSchema_category } from '@/validation/category-validation';
import { SEOFormValues } from '@/validation/seo-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import SubmitButton from './submit-button';

export type TCategoryFormValues = z.infer<typeof formSchema_category> & { id?: string };
type TTypeFormValues = TCategoryFormValues;

export const formSectionSEO: SectionConfig<SEOFormValues> = {
	title: 'forms.sections.seo_details',
	fields: [
		{
			type: 'text',
			name: 'seo_title_ar',
			label: 'forms.labels.seo_title_ar',
			placeholder: 'forms.placeholders.seo_title_ar',
		},
		{
			type: 'text',
			name: 'seo_title_en',
			label: 'forms.labels.seo_title_en',
			placeholder: 'forms.placeholders.seo_title_en',
		},
		{
			type: 'textarea',
			name: 'seo_description_ar',
			label: 'forms.labels.seo_description_ar',
			placeholder: 'forms.placeholders.seo_description_ar',
			rows: 6,
		},
		{
			type: 'textarea',
			name: 'seo_description_en',
			label: 'forms.labels.seo_description_en',
			placeholder: 'forms.placeholders.seo_description_en',
			rows: 6,
		},
		{
			type: 'text',
			name: 'slug_ar',
			label: 'forms.labels.slug_ar',
			placeholder: 'forms.placeholders.slug_ar',
			referenceInput: 'name_ar',
		},
		{
			type: 'text',
			name: 'slug_en',
			label: 'forms.labels.slug_en',
			placeholder: 'forms.placeholders.slug_en',
			referenceInput: 'name_en',
		},
		{
			type: 'text',
			name: 'seo_keywords_ar',
			label: 'forms.labels.seo_keywords_ar',
			placeholder: 'forms.placeholders.seo_keywords_ar',
		},
		{
			type: 'text',
			name: 'seo_keywords_en',
			label: 'forms.labels.seo_keywords_en',
			placeholder: 'forms.placeholders.seo_keywords_en',
		},
		// {
		// 	type: 'seoMockupCard',
		// 	name: 'seo_info',
		// 	parentClass: 'sm:col-span-full',
		// },
	],
};

export const formSections_category: SectionConfig<TTypeFormValues>[] = [
	{
		title: 'forms.sections.category_info',
		fields: [
			{
				type: 'text',
				name: 'name_ar',
				label: 'forms.labels.name_ar',
				placeholder: 'forms.placeholders.name_ar',
				required: true,
			},
			{
				type: 'text',
				name: 'name_en',
				label: 'forms.labels.name_en',
				placeholder: 'forms.placeholders.name_en',
				required: true,
			},
			{
				type: 'richtext',
				name: 'description_ar',
				label: 'forms.labels.description_ar',
				placeholder: 'forms.placeholders.description_ar',
			},
			{
				type: 'richtext',
				name: 'description_en',
				label: 'forms.labels.description_en',
				placeholder: 'forms.placeholders.description_en',
			},
			{
				type: 'imageUpload',
				name: 'image',
				label: 'forms.labels.image',
				placeholder: 'forms.placeholders.image',
				parentClass: 'col-span-full',
				folder: 'categories',
				// file: {
				// 	// accept: 'image/*',
				// 	// multiple: false,
				// },
				// multiple: true,
			},
		],
	},
	{
		title: 'forms.sections.extra_info',
		fields: [
			{
				type: 'combobox',
				name: 'products',
				label: msg('common.actions.choose_', { item: 'common.sections.products' }),
				placeholder: 'forms.placeholders.choose_categorys_products',
				optionUrl: `${config_env.domainAPI}/dashboard/brands`,
			},
		],
	},
	// SEO sections inputs with mockup card
	{
		title: 'forms.sections.seo_info',
		fields: [
			{
				type: 'text',
				name: 'seo_title_ar',
				label: 'forms.labels.seo_title_ar',
				placeholder: 'forms.placeholders.seo_title_ar',
				referenceInput: 'name_ar',
			},
			{
				type: 'text',
				name: 'seo_title_en',
				label: 'forms.labels.seo_title_en',
				placeholder: 'forms.placeholders.seo_title_en',
				referenceInput: 'name_en',
			},
			{
				type: 'textarea',
				name: 'seo_description_ar',
				label: 'forms.labels.seo_description_ar',
				placeholder: 'forms.placeholders.seo_description_ar',
				referenceInput: 'description_ar',
				rows: 6,
			},
			{
				type: 'textarea',
				name: 'seo_description_en',
				label: 'forms.labels.seo_description_en',
				placeholder: 'forms.placeholders.seo_description_en',
				rows: 6,
				referenceInput: 'description_en',
			},
			{
				type: 'slug',
				name: 'slug_ar',
				label: 'forms.labels.slug_ar',
				placeholder: 'forms.placeholders.slug_ar',
				referenceInput: 'name_ar',
			},
			{
				type: 'slug',
				name: 'slug_en',
				label: 'forms.labels.slug_en',
				placeholder: 'forms.placeholders.slug_en',
				referenceInput: 'name_en',
			},
			{
				type: 'text',
				name: 'seo_keywords_ar',
				label: 'forms.labels.seo_keywords_ar',
				placeholder: 'forms.placeholders.seo_keywords_ar',
			},
			{
				type: 'text',
				name: 'seo_keywords_en',
				label: 'forms.labels.seo_keywords_en',
				placeholder: 'forms.placeholders.seo_keywords_en',
			},
			{
				type: 'seoMockupCard',
				name: 'seo_title_ar',
				parentClass: 'sm:col-span-full',
			},
			{
				type: 'imageUpload',
				name: 'seo_image',
				label: 'forms.labels.seo_image',
				placeholder: 'forms.placeholders.seo_image',
				parentClass: 'col-span-full',
				folder: 'categories',
				description: 'forms.descriptions.seo_image',
			},
		],
	},
];

export default function CategoryForm({
	type = 'create',
	response,
	defaultValues = (response?.data as TTypeFormValues) || defaultValues_category,
}: {
	type?: 'create' | 'update';
	response?: ActionResult<TTypeFormValues>;
	defaultValues?: TTypeFormValues & { id?: string };
}) {
	const { t } = useTranslation();

	// for handling server response errors & messages
	useServerResponse(response);

	const form = useForm<TTypeFormValues>({
		resolver: zodResolver(formSchema_category),
		defaultValues,
		// delayError: 1000,
	});

	console.log('defaultValues', defaultValues);

	const [result, setResult] = useState<ActionResult<TTypeFormValues> | null>(null);

	useFormResponse<TTypeFormValues>(result!, form, {
		redirectUrl: `/${url_segment}`,
		reset_on_success: (result?.data as TTypeFormValues) || true,
	});

	console.log('errors', form.formState.errors);

	async function onSubmit(data: TTypeFormValues) {
		console.log('onSubmit data', data);
		const result =
			type == 'create' ? await createCategoryAction(data) : await updateCategoryAction(defaultValues.id || '', data);

		setResult(result as ActionResult<TTypeFormValues>);

		console.log('res category form', result);
	}

	return (
		<Form {...form}>
			<form
				id='category-form'
				onSubmit={form.handleSubmit(onSubmit)}
				method='post'
				className='w-full grid gap-6 relative'
			>
				{form.formState.isSubmitting && <LoaderInstElement />}
				{formSections_category.map((section, sectionIndex) => (
					<div key={'section-' + sectionIndex} className='form-section'>
						<div className='section-title font-medium text-muted-foreground'>{t(section.title)}</div>
						<div className='form-inputs'>
							{section.fields.map((fieldConfig, fieldIndex) => (
								<div key={`${fieldConfig.name}-input-${fieldIndex}`} className={fieldConfig.parentClass}>
									{renderField({ fieldConfig, form })}
								</div>
							))}
						</div>
					</div>
				))}

				{/* submit & cancel buttons */}
				<SubmitButton isPending={form.formState.isSubmitting} formId='category-form' />
			</form>
		</Form>
	);
}

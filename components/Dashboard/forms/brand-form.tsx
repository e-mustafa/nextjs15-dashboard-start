'use client';

import { url_segment } from '@/app/[locale]/dashboard/(products-management)/brands/page';
import { Form } from '@/components/ui-custom/custom-form';
import { useFormResponse } from '@/hooks/use-form-response';
import { useServerResponse } from '@/hooks/use-server-response';
import { renderField } from '@/lib/create-forms/input-registry';
import { SectionConfig } from '@/lib/create-forms/types-create-forms';
import { createBrandAction, updateBrandAction } from '@/server/actions/brand-actions';
import { ActionResult } from '@/types/api';
import { defaultValues_brand, formSchema_brand } from '@/validation/brand-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import SubmitButton from './submit-button';

export type TBrandFormValues = z.infer<typeof formSchema_brand> & { id?: string };

export const formSectionSEO: SectionConfig = {
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
			type: 'text',
			name: 'seo_description_ar',
			label: 'forms.labels.seo_description_ar',
			placeholder: 'forms.placeholders.seo_description_ar',
		},
		{
			type: 'text',
			name: 'seo_description_en',
			label: 'forms.labels.seo_description_en',
			placeholder: 'forms.placeholders.seo_description_en',
		},
		{ type: 'text', name: 'seo_link', label: 'forms.labels.seo_link', placeholder: 'forms.placeholders.seo_link' },
		{
			type: 'text',
			name: 'seo_keywords',
			label: 'forms.labels.seo_keywords',
			placeholder: 'forms.placeholders.seo_keywords',
		},
		{
			type: 'seoMockupCard',
			name: 'seo_info',
			parentClass: 'sm:col-span-full',
		},
	],
};

export const formSections_brand: SectionConfig<TBrandFormValues>[] = [
	{
		title: 'forms.sections.general_details',
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
				type: 'slug',
				name: 'slug_ar',
				locale: 'ar',
				referenceInput: 'name_ar',
			},

			{
				type: 'slug',
				name: 'slug_en',
				locale: 'en',
				referenceInput: 'name_en',
			},
			// {
			// 	type: 'imageManager',
			// 	name: 'image',
			// 	label: 'forms.labels.image',
			// 	placeholder: 'forms.placeholders.image',
			// 	file: {
			// 		// accept: 'image/*',
			// 		// multiple: false,
			// 	},
			// },
			{
				type: 'imageUpload',
				name: 'image',
				label: 'forms.labels.image',
				placeholder: 'forms.placeholders.image',
				parentClass: 'col-span-full',
				folder: 'brands',
				// file: {
				// 	// accept: 'image/*',
				// 	// multiple: false,
				// },
				// multiple: true,
			},
		],
	},
	// SEO sections inputs with mockup card
	// formSectionSEO,
];

export default function BrandForm({
	type = 'create',
	response,
	defaultValues = (response?.data as TBrandFormValues) || defaultValues_brand,
}: {
	type?: 'create' | 'update';
	response?: ActionResult<TBrandFormValues>;
	defaultValues?: TBrandFormValues & { id?: string };
}) {
	const { t } = useTranslation();

	// for handling server response errors & messages
	useServerResponse(response);

	const form = useForm<TBrandFormValues>({
		resolver: zodResolver(formSchema_brand),
		defaultValues,
		// delayError: 1000,
	});

	const [result, setResult] = useState<ActionResult<TBrandFormValues> | null>(null);

	useFormResponse<TBrandFormValues>(result!, form, {
		redirectUrl: `/${url_segment}`,
		reset_on_success: (result?.data as TBrandFormValues) || true,
	});

	console.log('errors', form.formState.errors);

	async function onSubmit(data: TBrandFormValues) {
		const result =
			type == 'create' ? await createBrandAction(data) : await updateBrandAction(defaultValues.id || '', data);

		setResult(result as ActionResult<TBrandFormValues>);

		console.log('res brand form', result);
	}

	return (
		<Form {...form}>
			<form id='brand-form' onSubmit={form.handleSubmit(onSubmit)} method='post' className='w-full grid gap-6'>
				{formSections_brand.map((section, sectionIndex) => (
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
				<SubmitButton isPending={form.formState.isSubmitting} formId='brand-form' />
			</form>
		</Form>
	);
}

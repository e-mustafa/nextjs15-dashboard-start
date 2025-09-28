'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Form } from '@/components/ui-custom/custom-form';
import { renderField } from '@/lib/create-forms/input-registry';

import { SectionConfig } from '@/lib/create-forms/types-create-forms';
import { saveBrandAction } from '@/server/actions/brand-actions';
import { defaultValues_brand, formSchema_brand } from '@/validation/brand-validation';
import { useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import SubmitButton from './submit-button';

export type TBrandFormValues = z.infer<typeof formSchema_brand>;

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

// const formatSlug = (event: ChangeEvent<HTMLInputElement>, form: UseFormReturn<TBrandFormValues>) => {
// 	console.log('onChange event:', event);
// 	console.log('onChange form:', form);
// 	const slug = event.target.value
// 		.trim()
// 		.toLowerCase()
// 		.replace(/[^a-z0-9]+/g, '-')
// 		.replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens

// 	form.setValue('slug', slug);
// };

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
	defaultValues = defaultValues_brand,
}: {
	type?: 'create' | 'update';
	defaultValues?: TBrandFormValues;
}) {
	const { t } = useTranslation();

	const form = useForm<TBrandFormValues>({
		resolver: zodResolver(formSchema_brand),
		defaultValues,
		delayError: 1000,
	});

	const [isPending, startTransition] = useTransition();
	console.log('isPending', isPending);

	async function onSubmit(data: TBrandFormValues) {
		const res = await saveBrandAction(data);
		console.log('res', res);

		if (res.success) {
			toast.success(t(res.message as string) ?? 'Success');
			form.reset();
		} else {
			toast.error(t(res.error as string) ?? 'Something went wrong');
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} method='post' className='w-full grid gap-6'>
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

				<SubmitButton />
			</form>
		</Form>
	);
}

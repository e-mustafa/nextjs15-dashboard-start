'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui-custom/custom-button';
import { Form } from '@/components/ui-custom/custom-form';
import { renderField } from '@/lib/create-forms/input-registry';

import { SectionConfig } from '@/lib/create-forms/types-create-forms';
import { defaultValues_brand, formSchema_brand } from '@/validation/brand-validation';
import { useTranslation } from 'react-i18next';

type TBrandFormValues = z.infer<typeof formSchema_brand>;

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
			// {
			// 	type: 'slug',
			// 	name: 'slug_ar',
			// 	locale: 'ar',
			// 	referenceInput: 'name_ar',
			// },

			// {
			// 	type: 'slug',
			// 	name: 'slug_en',
			// 	locale: 'en',
			// 	referenceInput: 'name_en',
			// },
			{
				type: 'uploadFile',
				name: 'image',
				label: 'forms.labels.description_en',
				placeholder: 'forms.placeholders.description_en',
				file: {
					// accept: 'image/*',
					// multiple: false,
				},
			},

			// {
			// 	type: 'password',
			// 	name: 'password',
			// 	label: 'forms.labels.password',
			// 	placeholder: 'forms.placeholders.password',
			// 	required: true,
			// },
			// {
			// 	type: 'combobox',
			// 	name: 'brand',
			// 	label: 'form.brand',
			// 	placeholder: 'form.ph_select_brand',
			// 	fetcher: fetchBrands,
			// },
		],
	},
	// SEO sections inputs with mockup card
	// formSectionSEO,
];

export default function BrandForm() {
	const { t } = useTranslation();

	// const { locale, dir, t, i18n } = useLocale();

	const form = useForm<TBrandFormValues>({
		resolver: zodResolver(formSchema_brand),
		defaultValues: defaultValues_brand,
		// mode: 'onChange',
		// reValidateMode: 'onChange',
		// criteriaMode: 'firstError',
		// shouldFocusError: true,
		// shouldUnregister: false,
		// shouldUseNativeValidation: false,
		// delayError: 1000,
	});

	function onSubmit(data: TBrandFormValues) {
		toast.success('You submitted the following values', {
			description: (
				<pre className='mt-2 w-[320px] rounded-md bg-neutral-950 p-4'>
					<code className='text-white'>{JSON.stringify(data, null, 2)}</code>
				</pre>
			),
		});
	}

	// useEffect(() => {
	// 	const name = form.watch('name_en').trim();

	// 	if (!name) return;

	// 	form.setValue(
	// 		'slug',
	// 		name
	// 			.toLowerCase()
	// 			.replace(/[^a-z0-9]+/g, '-')
	// 			.replace(/^-+|-+$/g, '')
	// 	);
	// }, [form.watch('name_en')]);

	return (
		<Form {...form}>
			{t('general.welcome')}
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

				<div className='pt-4'>
					<Button type='submit'>Submit</Button>
				</div>
			</form>
		</Form>
	);
}

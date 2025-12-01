'use client';

import { url_segment } from '@/app/[locale]/dashboard/(products-management)/categories/page';
import LoaderInstElement from '@/components/shard/loaders/loader-inst-element';
import { Form } from '@/components/ui-custom/custom-form';
import { config_env } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { useFormResponse } from '@/hooks/use-form-response';
import { useServerResponse } from '@/hooks/use-server-response';
import { formSectionSEO } from '@/lib/create-forms/form-section-seo';
import { renderField } from '@/lib/create-forms/input-registry';
import { SectionConfig } from '@/lib/create-forms/types-create-forms';
import { cn, msg } from '@/lib/utils';
import { createCategoryAction, updateCategoryAction } from '@/server/actions/category-actions';
import { ActionResult } from '@/types/api';
import { defaultValuesCategory, formSchemaCategory, TCategoryFormValues } from '@/validation/category-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import SubmitButton from './submit-button';

type TFormValues = TCategoryFormValues;

export const formSections_category: SectionConfig<TFormValues>[] = [
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
				type: 'switch',
				name: 'isActive',
				label: 'forms.labels.is_active',
				placeholder: 'forms.placeholders.is_active',
				required: true,
				// parentClass: 'min-w-full',
				variants: 'input', // 'switch',
			},
			{
				type: 'empty',
				name: 'isActive',
			},
			{
				type: 'richtext',
				name: 'description_ar',
				label: 'forms.labels.description_ar',
				placeholder: 'forms.placeholders.description_ar',
				parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
			},
			{
				type: 'richtext',
				name: 'description_en',
				label: 'forms.labels.description_en',
				placeholder: 'forms.placeholders.description_en',
				parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
			},
			{
				type: 'imageUpload',
				name: 'images',
				label: 'forms.labels.image',
				placeholder: 'forms.placeholders.image',
				parentClass: 'min-w-full',
				folder: 'categories',
				// file: {
				// 	// accept: 'image/*',
				// 	// multiple: false,
				// },
				multiple: true,
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
				optionUrl: `${config_env.domainAPI}/dashboard/categories`,
			},
		],
	},
	// SEO sections inputs with mockup card
	formSectionSEO as SectionConfig<TFormValues>,
];

export default function CategoryForm({
	type = EnumFormTypes.CREATE,
	response,
	defaultValues = (response?.data as TFormValues) || defaultValuesCategory,
}: {
	type?: EnumFormTypes;
	response?: ActionResult<TFormValues>;
	defaultValues?: TFormValues & { id?: string };
}) {
	const { t } = useTranslation();

	// for handling server response errors & messages
	useServerResponse(response);

	const form = useForm<TFormValues>({
		resolver: zodResolver(formSchemaCategory),
		defaultValues,
		// delayError: 1000,
	});

	const [result, setResult] = useState<ActionResult<TFormValues> | null>(null);
	const [isPending, startTransition] = useTransition();

	useFormResponse<TFormValues>(result!, form, {
		redirectUrl: `/${url_segment}`,
		reset_on_success: (result?.data as TFormValues) || true,
	});

	async function onSubmit(data: TFormValues) {
		startTransition(async () => {
			const result =
				type === EnumFormTypes.CREATE
					? await createCategoryAction(data)
					: await updateCategoryAction(defaultValues.id || '', data);

			setResult(result as ActionResult<TFormValues>);
		});
	}

	return (
		<Form {...form}>
			<form
				id='category-form'
				onSubmit={form.handleSubmit(onSubmit)}
				method='post'
				className='w-full grid gap-6 relative'
			>
				{(form.formState.isSubmitting || isPending) && <LoaderInstElement />}
				{formSections_category.map((section, sectionIndex) => (
					<div key={'section-' + sectionIndex} className='form-section'>
						<div className='section-title font-medium text-muted-foreground'>{t(section.title as string)}</div>
						<div className='form-inputs'>
							{section.fields.map((fieldConfig, fieldIndex) => (
								<div
									key={`${fieldConfig.name}-input-${fieldIndex}`}
									className={cn('flex-1 min-w-[calc(50%-1.5rem)]', fieldConfig.parentClass)}
								>
									{renderField({ fieldConfig, form })}
								</div>
							))}
						</div>
					</div>
				))}

				{/* submit & cancel buttons */}
				<SubmitButton isPending={form.formState.isSubmitting || isPending} formId='category-form' />
			</form>
		</Form>
	);
}

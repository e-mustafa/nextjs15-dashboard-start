'use client';

import { url_segment } from '@/app/[locale]/dashboard/(products-management)/collections/page';
import LoaderInstElement from '@/components/shard/loaders/loader-inst-element';
import { Form } from '@/components/ui-custom/custom-form';
import { config_env } from '@/configs/general';
import { useFormResponse } from '@/hooks/use-form-response';
import { useServerResponse } from '@/hooks/use-server-response';
import { formSectionSEO } from '@/lib/create-forms/form-section-seo';
import { renderField } from '@/lib/create-forms/input-registry';
import { SectionConfig } from '@/lib/create-forms/types-create-forms';
import { msg } from '@/lib/utils';
import { createCollectionAction, updateCollectionAction } from '@/server/actions/collection-actions';
import { ActionResult } from '@/types/api';
import { defaultValuesCollection, formSchemaCollection, TCollectionFormValues } from '@/validation/collection-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import SubmitButton from './submit-button';

type TFormValues = TCollectionFormValues;

export const formSections_collection: SectionConfig<TFormValues>[] = [
	{
		title: 'forms.sections.collection_info',
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
				// parentClass: 'col-span-full',
				variants: 'input', // 'switch',
			},
			{
				type: 'switch',
				name: 'isFeatured',
				label: 'forms.labels.is_featured',
				placeholder: 'forms.placeholders.is_featured',
				required: true,
				// parentClass: 'col-span-full',
				variants: 'input', // 'switch',
			},
			// {
			// 	type: 'empty',
			// 	name: 'isActive',
			// },
			{
				type: 'richtext',
				name: 'description_ar',
				label: 'forms.labels.description_ar',
				placeholder: 'forms.placeholders.description_ar',
				parentClass: 'col-span-full xl:col-span-1',
			},
			{
				type: 'richtext',
				name: 'description_en',
				label: 'forms.labels.description_en',
				placeholder: 'forms.placeholders.description_en',
				parentClass: 'col-span-full xl:col-span-1',
			},
			{
				type: 'imageUpload',
				name: 'images',
				label: 'forms.labels.image',
				placeholder: 'forms.placeholders.image',
				parentClass: 'col-span-full',
				folder: 'collections',
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
				optionUrl: `${config_env.domainAPI}/dashboard/collections`,
			},
		],
	},
	// SEO sections inputs with mockup card
	formSectionSEO as SectionConfig<TFormValues>,
];

export default function CollectionForm({
	type = 'create',
	response,
	defaultValues = (response?.data as TFormValues) || defaultValuesCollection,
}: {
	type?: 'create' | 'update';
	response?: ActionResult<TFormValues>;
	defaultValues?: TFormValues & { id?: string };
}) {
	const { t } = useTranslation();

	// for handling server response errors & messages
	useServerResponse(response);

	const form = useForm<TFormValues>({
		resolver: zodResolver(formSchemaCollection),
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
				type == 'create'
					? await createCollectionAction(data)
					: await updateCollectionAction(defaultValues.id || '', data);

			setResult(result as ActionResult<TFormValues>);
		});
	}

	return (
		<Form {...form}>
			<form
				id='collection-form'
				onSubmit={form.handleSubmit(onSubmit)}
				method='post'
				className='w-full grid gap-6 relative'
			>
				{(form.formState.isSubmitting || isPending) && <LoaderInstElement />}
				{formSections_collection.map((section, sectionIndex) => (
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
				<SubmitButton isPending={form.formState.isSubmitting || isPending} formId='collection-form' />
			</form>
		</Form>
	);
}

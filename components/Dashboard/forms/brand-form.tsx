'use client';

import { url_segment } from '@/app/[locale]/dashboard/(products-management)/brands/page';
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
import { createBrandAction, updateBrandAction } from '@/server/actions/brand-actions';
import { useGProgressBarStore } from '@/stores/global-progress-bar.store';
import { ActionResult } from '@/types/api';
import { defaultValuesBrand, formSchemaBrand, TBrandFormValues } from '@/validation/brand-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import SubmitButton from './submit-button';

type TFormValues = TBrandFormValues;

export const formSections_brand: SectionConfig<TFormValues>[] = [
	{
		title: 'forms.sections.brand_info',
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
				folder: 'brands',
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
				placeholder: 'forms.placeholders.choose_brands_products',
				optionUrl: `${config_env.domainAPI}/dashboard/brands`,
				revalidateTags: ['brands'],
				multiple: true,
				isProducts: true,
			},
		],
	},
	// SEO sections inputs with mockup card
	formSectionSEO as SectionConfig<TFormValues>,
];

export default function BrandForm({
	type = EnumFormTypes.CREATE,
	response,
	defaultValues = (response?.data as TFormValues) || defaultValuesBrand,
}: {
	type?: EnumFormTypes;
	response?: ActionResult<TFormValues>;
	defaultValues?: TFormValues & { id?: string };
}) {
	const { t } = useTranslation();
	const { setProcessing } = useGProgressBarStore();

	// for handling server response errors & messages
	useServerResponse(response);

	const form = useForm<TFormValues>({
		resolver: zodResolver(formSchemaBrand),
		defaultValues,
		// delayError: 1000,
	});

	const [result, setResult] = useState<ActionResult<TFormValues> | null>(null);
	const [isPending, startTransition] = useTransition();

	useFormResponse<TFormValues>(result!, form, {
		redirectUrl: `/${url_segment}`,
		reset_on_success: (result?.data as TFormValues) || true,
	});

	useEffect(() => {
		setProcessing(isPending);
	}, [isPending, setProcessing]);

	async function onSubmit(data: TFormValues) {
		startTransition(async () => {
			const result =
				type === EnumFormTypes.CREATE
					? await createBrandAction(data)
					: await updateBrandAction(defaultValues.id || '', data);

			setResult(result as ActionResult<TFormValues>);
		});
	}

	return (
		<Form {...form}>
			<form id='brand-form' onSubmit={form.handleSubmit(onSubmit)} method='post' className='w-full grid gap-6 relative'>
				{(form.formState.isSubmitting || isPending) && <LoaderInstElement />}
				{formSections_brand.map((section, sectionIndex) => (
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
				<SubmitButton isPending={form.formState.isSubmitting || isPending} formId='brand-form' />
			</form>
		</Form>
	);
}

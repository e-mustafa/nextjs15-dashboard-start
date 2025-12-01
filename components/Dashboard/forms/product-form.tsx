'use client';
import { url_segment } from '@/app/[locale]/dashboard/(products-management)/products/page';
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
import { createProductAction, updateProductAction } from '@/server/actions/product-actions';
import { ActionResult } from '@/types/api';
import { defaultValuesProduct, formSchemaProduct, TProductFormValues } from '@/validation/product-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { PoundSterlingIcon, RulerIcon, WeightIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import SubmitButton from './submit-button';

export const formSections_product: SectionConfig<TFormValues>[] = [
	{
		title: 'forms.sections.product_info',
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
				type: 'textarea',
				name: 'shortDescription_ar',
				label: 'forms.labels.short_description_ar',
				placeholder: 'forms.placeholders.short_description_ar',
				// parentClass: 'col-span-full xl:col-span-1',
			},
			{
				type: 'textarea',
				name: 'shortDescription_en',
				label: 'forms.labels.short_description_en',
				placeholder: 'forms.placeholders.short_description_en',
				// parentClass: 'col-span-full xl:col-span-1',
			},
			{
				type: 'richtext',
				name: 'description_ar',
				label: 'forms.labels.description_ar',
				placeholder: 'forms.placeholders.description_ar',
				parentClass: 'min-w-full',
			},
			{
				type: 'richtext',
				name: 'description_en',
				label: 'forms.labels.description_en',
				placeholder: 'forms.placeholders.description_en',
				parentClass: 'min-w-full',
			},
			{
				type: 'imageUpload',
				name: 'images',
				label: 'forms.labels.image',
				placeholder: 'forms.placeholders.images',
				parentClass: 'min-w-full',
				folder: 'products',
				// file: {
				// 	// accept: 'image/*',
				// 	// multiple: false,
				// },
				multiple: true,
			},
		],
	},
	// prices
	{
		title: 'forms.sections.price_info',
		fields: [
			{
				type: 'number',
				name: 'basePrice',
				label: 'forms.labels.price',
				placeholder: 'forms.placeholders.price',
				parentClass: 'min-w-[calc(33.333%-1rem)]',
				IconStart: PoundSterlingIcon,
				IconEnd: () => <span className='text-sm font-medium text-muted-foreground me-2'>EGP</span>,
				required: true,
			},
			{
				type: 'number',
				name: 'compareAtPrice',
				label: 'forms.labels.discount_price',
				placeholder: 'forms.placeholders.discount_price',
				parentClass: 'min-w-[calc(33.333%-1rem)]',
				IconStart: PoundSterlingIcon,
				IconEnd: () => <span className='text-sm font-medium text-muted-foreground me-2'>EGP</span>,
			},
			// {
			// 	type: 'datetime',
			// 	name: 'discountEndDate',
			// 	label: 'forms.labels.discount_expiry_date',
			// 	placeholder: 'forms.placeholders.discount_expiry_date',
			// 	parentClass: 'min-w-[calc(33.333%-1rem)]',
			// },
			{
				type: 'number',
				name: 'cost',
				label: 'forms.labels.product_cost',
				placeholder: 'forms.placeholders.product_cost',
				parentClass: 'min-w-[calc(33.333%-1rem)]',
				IconStart: PoundSterlingIcon,
				IconEnd: () => <span className='text-sm font-medium text-muted-foreground me-2'>EGP</span>,
				infoContent: 'forms.infos.product_cost',
			},
		],
	},
	// inventory
	{
		title: 'forms.sections.inventory_info',
		fields: [
			{
				type: 'number',
				name: 'stockQuantity',
				label: 'forms.labels.stock_quantity',
				placeholder: 'forms.placeholders.stock_quantity',
			},
			{
				type: 'text',
				name: 'unit',
				label: 'forms.labels.unit',
				placeholder: 'forms.placeholders.unit',
			},
			{
				type: 'number',
				name: 'lowStockAlert',
				label: 'forms.labels.low_stock_Alert',
				placeholder: 'forms.placeholders.low_stock_Alert',
			},
			{
				type: 'checkbox',
				name: 'keepSelling',
				label: 'forms.labels.keep_selling',
				placeholder: 'forms.placeholders.keep_selling',
				// items: [{ name: 'trackInventory', label: 'forms.labels.compare_at_price', checked: false }],
			},
			{
				type: 'text',
				name: 'sku',
				label: 'forms.labels.sku',
				placeholder: 'forms.placeholders.sku',
			},
		],
	},
	// shipping
	{
		title: 'forms.sections.shipping_info',
		fields: [
			{
				type: 'number',
				name: 'weight',
				label: 'forms.labels.weight',
				placeholder: '0.00',
				parentClass: 'min-w-[calc(25%-1.125rem)]',
				IconStart: WeightIcon,
				IconEnd: 'common.units.kilogram_short',
			},
			{
				type: 'number',
				name: 'length',
				label: 'forms.labels.length',
				placeholder: '0.00',
				parentClass: 'min-w-[calc(25%-1.125rem)]',
				IconStart: RulerIcon,
				IconEnd: 'common.units.centimeter_short',
			},
			{
				type: 'number',
				name: 'width',
				label: 'forms.labels.width',
				placeholder: '0.00',
				parentClass: 'min-w-[calc(25%-1.125rem)]',
				IconStart: RulerIcon,
				IconEnd: 'common.units.centimeter_short',
			},
			{
				type: 'number',
				name: 'height',
				label: 'forms.labels.height',
				placeholder: '0.00',
				parentClass: 'min-w-[calc(25%-1.125rem)]',
				IconStart: RulerIcon,
				IconEnd: 'common.units.centimeter_short',
			},
		],
	},
	// specifications
	{
		title: 'forms.sections.specifications_info',
		fields: [
			{
				type: 'SpecificationsList',
				name: 'specifications',
			},
		],
	},
	// variants
	{
		title: 'forms.sections.variants_info',
		fields: [
			{
				type: 'productVariants',
				name: 'variants',
				attributesName: 'attributes',
				skuName: 'sku',
			},
		],
	},
	// SEO sections inputs with mockup card
	formSectionSEO as SectionConfig<TFormValues>,
];

export const formSections_product2: SectionConfig<TFormValues> = {
	// title: 'forms.sections.product_info',
	fields: [
		{
			type: 'switch',
			name: 'isActive',
			label: 'forms.labels.is_active',
			placeholder: 'forms.placeholders.is_active',
			required: true,
			// variants: 'input', // 'switch',
		},
		{
			type: 'combobox',
			name: 'brand',
			label: msg('common.actions.choose_', { item: 'common.sections.the_brand' }),
			placeholder: 'forms.placeholders.choose_products_brand',
			optionUrl: `${config_env.domainAPI}/dashboard/brands`,
		},
		{
			type: 'combobox',
			name: 'category',
			label: msg('common.actions.choose_', { item: 'common.sections.the_category' }),
			placeholder: 'forms.placeholders.choose_products_category',
			optionUrl: `${config_env.domainAPI}/dashboard/categories`,
		},
		{
			type: 'combobox',
			name: 'collections',
			label: msg('common.actions.choose_', { item: 'common.sections.collections' }),
			placeholder: 'forms.placeholders.choose_products_collection',
			optionUrl: `${config_env.domainAPI}/dashboard/collections`,
			multiple: true,
		},
		{
			type: 'combobox',
			name: 'tags',
			label: msg('common.actions.choose_', { item: 'common.sections.tags' }),
			placeholder: 'forms.placeholders.choose_products_tags',
			optionUrl: `${config_env.domainAPI}/dashboard/tags`,
			isTags: true,
		},
	],
};
type TFormValues = TProductFormValues;
export default function ProductForm({
	type = EnumFormTypes.CREATE,
	response,
	defaultValues = (response?.data as TFormValues) || defaultValuesProduct,
}: {
	type?: EnumFormTypes;
	response?: ActionResult<TFormValues>;
	defaultValues?: TFormValues & { id?: string };
}) {
	const { t } = useTranslation();
	// for handling server response errors & messages
	useServerResponse(response);

	const form = useForm<TFormValues>({
		resolver: zodResolver(formSchemaProduct),
		defaultValues,
		delayError: 300,
	});

	const [result, setResult] = useState<ActionResult<TFormValues> | null>(null);
	const [isPending, startTransition] = useTransition();

	useFormResponse<TFormValues>(result!, form, {
		redirectUrl: `/${url_segment}`,
		reset_on_success: (result?.data as TFormValues) || true,
		storageKey: type == 'create' ? 'create-product' : 'update-product-' + (defaultValues.id || ''),
	});

	async function onSubmit(data: TFormValues) {
		startTransition(async () => {
			const result =
				type == 'create' ? await createProductAction(data) : await updateProductAction(defaultValues.id || '', data);

			setResult(result as ActionResult<TFormValues>);
		});
	}

	const resetForm = () => {
		form.reset(defaultValues);
		localStorage.removeItem(type == 'create' ? 'create-product' : 'update-product-' + (defaultValues.id || ''));
	};

	return (
		<Form {...form}>
			<form id='product-form' onSubmit={form.handleSubmit(onSubmit)} method='post' className='grid xl:grid-cols-7 gap-6'>
				{(form.formState.isSubmitting || isPending) && <LoaderInstElement />}

				<div className='xl:col-span-5 w-full grid gap-6 relative'>
					{formSections_product?.map((section, sectionIndex) => (
						<div key={'section-' + sectionIndex} className='form-section'>
							<div className='section-title font-medium text-muted-foreground'>{t(section?.title || '')}</div>
							<div className='form-inputs'>
								{section?.fields?.map((fieldConfig, fieldIndex) => (
									<div
										key={`${fieldConfig.name}-input-${fieldIndex}`}
										className={cn('flex-1 min-w-[calc(50%-1.5rem)]', fieldConfig.parentClass)}
									>
										{renderField({ fieldConfig, form: form })}
									</div>
								))}
							</div>
						</div>
					))}
				</div>

				<div className='relative col-span-2'>
					<div className='sticky top-6 form-section'>
						{formSections_product2?.title && (
							<div className='section-title font-medium text-muted-foreground'>{t(formSections_product2?.title)}</div>
						)}

						{formSections_product2?.fields?.map((fieldConfig, fieldIndex) => (
							<div key={`${fieldConfig.name}-input-${fieldIndex}`} className={cn('flex-1', fieldConfig.parentClass)}>
								{renderField({ fieldConfig, form: form })}
							</div>
						))}
					</div>
				</div>

				{/* submit & cancel buttons */}
				<div className='xl:col-span-5 flex sm:justify-end'>
					<SubmitButton
						isPending={form.formState.isSubmitting || isPending}
						formId='product-form'
						resetForm={resetForm}
					/>
				</div>
			</form>
		</Form>
	);
}

'use client';
import { url_segment } from '@/app/[locale]/dashboard/(products-management)/discounts/page';
import LoaderInstElement from '@/components/shard/loaders/loader-inst-element';
import { Form } from '@/components/ui-custom/custom-form';
import { config_env, currenciesData } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { useFormResponse } from '@/hooks/use-form-response';
import { useServerResponse } from '@/hooks/use-server-response';
import useLocale from '@/hooks/useLocale';
import { calculateDiscountedPrice } from '@/lib/calculate-discounted-price';
import { renderField } from '@/lib/create-forms/input-registry';
import { SectionConfig } from '@/lib/create-forms/types-create-forms';
import { formatMoney } from '@/lib/format-money';
import { cn, msg } from '@/lib/utils';
import { createDiscountAction, updateDiscountAction } from '@/server/actions/discount-actions';
import { FormattedDiscount } from '@/server/services/discount-service';
import { TProduct } from '@/server/services/product-service';
import { useGProgressBarStore } from '@/stores/global-progress-bar.store';
import { ActionResult } from '@/types/api';
import { defaultValuesDiscount, formSchemaDiscount, TDiscountFormValues } from '@/validation/discount-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { DiscountType } from '@prisma/client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import SubmitButton from './submit-button';

type TFormValues = TDiscountFormValues; // & { type: DiscountType };

export default function DiscountForm({
	type = EnumFormTypes.CREATE,
	response,
	defaultValues = (response?.data as TFormValues) || defaultValuesDiscount,
}: {
	type?: EnumFormTypes;
	response?: ActionResult<TFormValues | FormattedDiscount>;
	defaultValues?: TFormValues & { id?: string };
}) {
	const { t, locale } = useLocale();
	const { setProcessing } = useGProgressBarStore();

	// for handling server response errors & messages
	useServerResponse(response);
	console.log('response?.data', response);

	const form = useForm<TFormValues>({
		resolver: zodResolver(formSchemaDiscount),
		defaultValues,
		// delayError: 1000,
	});

	const discountType = form.watch('type');

	const formSections_discount = useMemo(
		(): SectionConfig<TFormValues>[] =>
			[
				{
					title: 'forms.sections.discount_info',
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
							placeholder: 'forms.placeholders.is_active_discount',
							required: true,
							variants: 'input', // 'switch',
						},
						{
							type: 'empty',
							name: 'isActive',
						},
						{
							type: 'selectFiled',
							name: 'type',
							label: 'forms.labels.discount_value_type',
							placeholder: 'forms.labels.discount_value_type',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
							required: true,
							noneItem: false,
							options: [
								{
									value: DiscountType.FIXED,
									label: 'forms.select.fixed',
								},
								{
									value: DiscountType.PERCENTAGE,
									label: 'forms.select.percentage',
								},
							],
						},
						{
							type: 'number',
							name: 'value',
							label: 'forms.labels.discount_value',
							placeholder: 'forms.labels.discount_value',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',

							IconEnd: () => (
								<span className='text-base text-muted-foreground'>
									{discountType === DiscountType.FIXED ? currenciesData.egp.symbol : '%'}
								</span>
							),
						},
						...(discountType === DiscountType.PERCENTAGE
							? [
									{
										type: 'number',
										name: 'minDiscountValue',
										label: 'forms.labels.min_discount_value',
										placeholder: '0.00',
										parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
										IconEnd: () => (
											<span className='text-base text-muted-foreground'>{currenciesData.egp.symbol}</span>
										),
										// required: true,
									},
									{
										type: 'number',
										name: 'maxDiscountValue',
										label: 'forms.labels.max_discount_value',
										placeholder: '0.00',
										parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
										IconEnd: () => (
											<span className='text-base text-muted-foreground'>{currenciesData.egp.symbol}</span>
										),
										// required: true,
									},
							  ]
							: []),
						// {
						// 	type: 'date',
						// 	name: 'startDate',
						// 	label: 'forms.labels.discount_start_date',
						// 	placeholder: 'forms.placeholders.discount_start_date',
						// 	parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
						// },
						{
							type: 'multiDatePicker',
							name: 'startDate',
							label: 'forms.labels.discount_start_date',
							placeholder: 'forms.placeholders.discount_start_date',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
							required: true,
							// datePickerMode: 'SINGLE',
							timePicker: true,
							// minDate: new Date(),
							dateOptions: { minDate: Date.now() },
						},
						{
							type: 'multiDatePicker',
							name: 'endDate',
							label: 'forms.labels.discount_end_date',
							placeholder: 'forms.placeholders.discount_end_date',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
							// required: true,
							datePickerMode: 'SINGLE',
							timePicker: true,
							dateOptions: { minDate: Date.now() },
						},
					],
				},
				{
					title: 'forms.sections.choose_products_to_discount',
					fields: [
						{
							type: 'combobox',
							name: 'products',
							label: msg('common.actions.choose_', { item: 'common.sections.products' }),
							placeholder: 'forms.placeholders.choose_products_to_discount',
							optionUrl: `${config_env.domainAPI}/dashboard/products`,
							linkHref: '/dashboard/products',
							revalidateTags: ['products'],
							multiple: true,
							isProducts: true,
							required: true,
							customColumn: (product: TProduct) => {
								const type = form.watch('type');
								const value = form.watch('value');
								const min = form.watch('minDiscountValue');
								const max = form.watch('maxDiscountValue');

								const { finalPrice: countedPrice, discountApplied } = calculateDiscountedPrice({
									basePrice: product.basePrice,
									type,
									value,
									minDiscountValue: min,
									maxDiscountValue: max,
								});

								const isDirty = form.formState.isDirty;
								console.log('isDirty', isDirty);
								// form.formState.dirtyFields['minDiscountValue'] ||
								// form.formState.dirtyFields['maxDiscountValue'];

								return (
									<div className='flex items-center justify-between gap-4 px-3'>
										<span className={cn('text-xs', { 'line-through': value > 0 })}>
											{product.basePrice.toLocaleString('en')}
										</span>
										<span className='text-xs text-destructive whitespace-nowrap'>{`(-${discountApplied})`}</span>
										<span className='text-sm text-foreground whitespace-nowrap [&_svg]:size-5' dir='ltr'>
											{value > 0
												? formatMoney(!isDirty ? product.finalPrice || countedPrice : countedPrice, 'EGP')
												: '-'}
										</span>
									</div>
								);
							},
						},
					],
				},
			] as SectionConfig<TFormValues>[],
		[discountType]
	);

	const [result, setResult] = useState<ActionResult<FormattedDiscount> | null>(null);
	const [isPending, startTransition] = useTransition();

	useFormResponse<TFormValues>(result!, form, {
		redirectUrl: `/${url_segment}`,
		reset_on_success: (result?.data as FormattedDiscount) || true,
	});

	const errors = form.formState.errors;
	const formValues = form.getValues();
	console.log('errors', errors);
	console.log('formValues', formValues);

	useEffect(() => {
		setProcessing(isPending);
	}, [isPending, setProcessing]);

	async function onSubmit(data: TFormValues) {
		startTransition(async () => {
			const result =
				type == EnumFormTypes.CREATE
					? await createDiscountAction(data)
					: await updateDiscountAction(defaultValues.id || '', data);

			setResult(result);
		});
	}

	return (
		<Form {...form}>
			<form
				id='discount-form'
				onSubmit={form.handleSubmit(onSubmit)}
				method='post'
				className='w-full grid gap-6 relative'
			>
				{(form.formState.isSubmitting || isPending) && <LoaderInstElement />}
				{formSections_discount.map((section, sectionIndex) => (
					<div key={'section-' + sectionIndex} className='form-section'>
						{!!section?.title && (
							<div className='section-title font-medium text-muted-foreground'>{t(section.title as string)}</div>
						)}
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
				<SubmitButton
					isPending={form.formState.isSubmitting || isPending}
					formId='discount-form'
					resetForm={() => form.reset(defaultValues)}
				/>
			</form>
		</Form>
	);
}

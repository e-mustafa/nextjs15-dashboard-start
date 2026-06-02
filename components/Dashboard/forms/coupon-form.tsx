'use client';
import {
	tags as tags_categories,
	url_segment as url_categories,
} from '@/app/[locale]/dashboard/(products-management)/categories/page';
import {
	tags as tags_collections,
	url_segment as url_collections,
} from '@/app/[locale]/dashboard/(products-management)/collections/page';
import { url_segment } from '@/app/[locale]/dashboard/(products-management)/coupons/page';
import {
	tags as tags_products,
	url_segment as url_products,
} from '@/app/[locale]/dashboard/(products-management)/products/page';
import CopyButton from '@/components/copy-button';
import LoaderInstElement from '@/components/Shared/loaders/loader-inst-element';
import { Form } from '@/components/ui-custom/custom-form';
import { config_env, currenciesData } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { useFormResponse } from '@/hooks/use-form-response';
import { useServerResponse } from '@/hooks/use-server-response';
import useLocale from '@/hooks/useLocale';
import { renderField } from '@/lib/create-forms/input-registry';
import { SectionConfig } from '@/lib/create-forms/types-create-forms';
import { formatMoney } from '@/lib/format-money';
import { cn, msg } from '@/lib/utils';
import { createCouponAction, updateCouponAction } from '@/server/actions/coupon-actions';
import { TProduct } from '@/server/services/product-service/types';
import { calculateCouponDiscount } from '@/server/services/utils';
import { useGProgressBarStore } from '@/stores/global-progress-bar.store';
import { ActionResult } from '@/types/api';
import {
	defaultValuesCoupon,
	EnumCouponApplicableOn,
	EnumCouponTypes,
	formSchemaCoupon,
	TCouponFormValues,
} from '@/validation/coupon-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { TicketIcon } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import SubmitButton from './submit-button';

type TFormValues = TCouponFormValues; // & { type: EnumCouponTypes };

export default function CouponForm({
	type = EnumFormTypes.CREATE,
	response,
	defaultValues = (response?.data as TFormValues) || defaultValuesCoupon,
}: {
	type?: EnumFormTypes;
	response?: ActionResult<TFormValues>;
	defaultValues?: (TFormValues & { id?: string }) | TFormValues;
}) {
	const { t, locale } = useLocale();
	const { setProcessing } = useGProgressBarStore();
	console.log('response?.data', response?.data);
	// for handling server response errors & messages
	useServerResponse(response);

	const initialItems = (response?.data as TFormValues)?.initialItems || defaultValues?.initialItems;

	console.log('defaultValues', defaultValues);

	const form = useForm({
		resolver: zodResolver(formSchemaCoupon), // as Resolver<TFormValues>,
		// defaultValues,
		// delayError: 1000,
		defaultValues: {
			...defaultValues,
			// ✅ Ensure we're using IDs only for form values
			products: defaultValues.products || [],
			categories: defaultValues.categories || [],
			collections: defaultValues.collections || [],
		},
	});

	const couponTypes = form.watch('type');
	const couponApplicableOn = form.watch('applicableOn');

	// descriptions for applicable on options
	const applicableOnDescription = {
		ALL_PRODUCTS: 'forms.descriptions.coupon.apply_on_all_products',
		SPECIFIC_PRODUCTS: 'forms.descriptions.coupon.apply_on_specific_products',
		SPECIFIC_CATEGORIES: 'forms.descriptions.coupon.apply_on_specific_categories',
		SPECIFIC_COLLECTIONS: 'forms.descriptions.coupon.apply_on_specific_collections',
		MINIMUM_PURCHASE: 'forms.descriptions.coupon.apply_on_minimum_purchase_amount',
	};

	const formSections_coupon = useMemo(
		(): SectionConfig<TFormValues>[] =>
			[
				{
					title: 'forms.sections.coupon_info',
					fields: [
						{
							type: 'text',
							name: 'code',
							label: 'forms.labels.coupon_code',
							placeholder: 'forms.placeholders.coupon_code',
							required: true,
							IconStart: () => <TicketIcon className='!size-6' />,
							IconEnd: () => <CopyButton data={form.getValues('code')}></CopyButton>,
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
							name: 'description_ar',
							label: 'forms.labels.description_ar',
							placeholder: 'forms.placeholders.description_ar',
						},
						{
							type: 'textarea',
							name: 'description_en',
							label: 'forms.labels.description_en',
							placeholder: 'forms.placeholders.description_en',
						},
						{
							type: 'empty',
							// name: 'isActive',
						},
						{
							type: 'empty',
							// name: 'isActive',
						},
						{
							type: 'selectFiled',
							name: 'type',
							label: 'forms.labels.coupon_type',
							placeholder: 'forms.labels.coupon_type',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
							required: true,
							noneItem: false,
							options: [
								{
									value: EnumCouponTypes.FIXED,
									label: 'forms.select.fixed',
								},
								{
									value: EnumCouponTypes.PERCENTAGE,
									label: 'forms.select.percentage',
								},
								{
									value: EnumCouponTypes.FREE_SHIPPING,
									label: 'forms.select.free_shipping',
								},
							],
						},
						{
							type: 'number',
							name: 'value',
							label: 'forms.labels.coupon_value',
							placeholder: 'forms.labels.coupon_value',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',

							IconEnd: () => (
								<span className='text-base text-muted-foreground'>
									{couponTypes === EnumCouponTypes.FIXED ? currenciesData.egp.symbol : '%'}
								</span>
							),
						},
						...(couponTypes === EnumCouponTypes.PERCENTAGE
							? [
									{
										type: 'number',
										name: 'minPurchaseAmount',
										label: 'forms.labels.minPurchaseAmount',
										placeholder: '0.00',
										parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
										IconEnd: () => (
											<span className='text-base text-muted-foreground'>{currenciesData.egp.symbol}</span>
										),
										// required: true,
									},
									{
										type: 'number',
										name: 'maxDiscountAmount',
										label: 'forms.labels.maxDiscountAmount',
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
						// 	label: 'forms.labels.coupon_start_date',
						// 	placeholder: 'forms.placeholders.coupon_start_date',
						// 	parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
						// },
						{
							type: 'multiDatePicker',
							name: 'startDate',
							label: 'forms.labels.coupon_start_date',
							placeholder: 'forms.placeholders.coupon_start_date',
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
							label: 'forms.labels.coupon_expiry_date',
							placeholder: 'forms.placeholders.coupon_expiry_date',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
							// required: true,
							datePickerMode: 'SINGLE',
							timePicker: true,
							dateOptions: { minDate: Date.now() },
						},
					],
				},

				{
					title: 'forms.sections.coupon_usage_info',
					fields: [
						{
							type: 'number',
							name: 'usageLimit',
							label: 'forms.labels.coupon_usage_limit',
							placeholder: 'forms.placeholders.coupon_usage_limit',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
						},
						{
							type: 'number',
							name: 'usagePerUser',
							label: 'forms.labels.coupon_limit_per_user',
							placeholder: 'forms.placeholders.coupon_limit_per_user',
							parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
						},
					],
				},
				{
					title: 'forms.sections.elements_apply_coupon',
					fields: [
						{
							type: 'selectFiled',
							name: 'applicableOn',
							label: 'forms.labels.elements_apply_coupon',
							placeholder: 'forms.labels.elements_apply_coupon',
							// parentClass: 'min-w-full xl:min-w-[calc(50%-1.5rem)]',
							parentClass: 'min-w-[calc(100%-1.125rem)]',
							required: true,
							noneItem: false,
							description: applicableOnDescription[couponApplicableOn],

							options: [
								{
									value: EnumCouponApplicableOn.ALL_PRODUCTS,
									label: 'forms.select.all_products',
								},
								{
									value: EnumCouponApplicableOn.SPECIFIC_PRODUCTS,
									label: 'forms.select.specific_products',
								},
								{
									value: EnumCouponApplicableOn.SPECIFIC_CATEGORIES,
									label: 'forms.select.specific_categories',
								},
								{
									value: EnumCouponApplicableOn.SPECIFIC_COLLECTIONS,
									label: 'forms.select.specific_collections',
								},
								{
									value: EnumCouponApplicableOn.MINIMUM_PURCHASE,
									label: 'forms.select.minimum_purchase',
								},
							],
						},
						// {
						// 	type: 'empty',
						// },

						...(couponApplicableOn === EnumCouponApplicableOn.SPECIFIC_PRODUCTS
							? [
									{
										type: 'combobox',
										name: 'products',
										label: msg('common.actions.choose_', { item: 'common.sections.products' }),
										placeholder: 'forms.placeholders.choose_products_to_coupon',
										optionUrl: `${config_env.domainAPI}${url_products}`,
										linkHref: url_products,
										revalidateTags: tags_products,
										multiple: true,
										isProducts: true,
										required: true,
										initialItems: initialItems?.products || [],
										customColumn: (product: TProduct) => {
											const type = form.watch('type');
											const value = form.watch('value');
											// const min = form.watch('minPurchaseAmount');
											const max = form.watch('maxDiscountAmount');

											const total = calculateCouponDiscount(
												{
													type,
													value,
													maxDiscountAmount: max,
												},
												product.basePrice,
											);

											const isDirty = form.formState.isDirty;

											return (
												<div className='flex items-center justify-between gap-4 px-3'>
													<span className={cn('text-xs', { 'line-through': value > 0 })}>
														{product.basePrice.toLocaleString('en')}
													</span>
													<span className='text-xs text-destructive whitespace-nowrap'>{`(-${total})`}</span>
													<span className='text-sm text-foreground whitespace-nowrap [&_svg]:size-5' dir='ltr'>
														{value > 0
															? formatMoney(
																	!isDirty ? product.finalPrice || 0 : (product.finalPrice || 0) - total,
																	'EGP',
																)
															: '-'}
													</span>
												</div>
											);
										},
									},
								]
							: couponApplicableOn === EnumCouponApplicableOn.SPECIFIC_CATEGORIES
								? [
										{
											type: 'combobox',
											name: 'categories',
											label: msg('common.actions.choose_', { item: 'common.sections.categories' }),
											placeholder: 'forms.placeholders.choose_categories_to_coupon',
											optionUrl: `${config_env.domainAPI}${url_categories}`,
											linkHref: url_categories,
											revalidateTags: tags_categories,
											multiple: true,
											isProducts: true,
											required: true,
											// initialItems: addInitialItems('categories'),
											initialItems: initialItems?.categories || [],
										},
									]
								: couponApplicableOn === EnumCouponApplicableOn.SPECIFIC_COLLECTIONS
									? [
											{
												type: 'combobox',
												name: 'collections',
												label: msg('common.actions.choose_', { item: 'common.sections.collections' }),
												placeholder: 'forms.placeholders.choose_collections_to_coupon',
												optionUrl: `${config_env.domainAPI}${url_collections}`,
												linkHref: url_collections,
												revalidateTags: tags_collections,
												multiple: true,
												isProducts: true,
												required: true,
												// initialItems: addInitialItems('collections'),
												initialItems: initialItems?.collections || [],
											},
										]
									: []),
					],
				},
			] as SectionConfig<TFormValues>[],
		[couponTypes, couponApplicableOn],
	);

	const [result, setResult] = useState<ActionResult<TFormValues> | null>(null);
	const [isPending, startTransition] = useTransition();

	useFormResponse(result, form, {
		redirectUrl: url_segment,
		reset_on_success: result?.data as TFormValues,
	});

	useEffect(() => {
		setProcessing(isPending);
	}, [isPending, setProcessing]);

	async function onSubmit(data: TFormValues) {
		startTransition(async () => {
			const actionResult =
				type == EnumFormTypes.CREATE
					? await createCouponAction(data)
					: await updateCouponAction(defaultValues.id || '', data);

			setResult(actionResult as ActionResult<TFormValues>);
		});
	}

	return (
		<Form {...form}>
			<form id='coupon-form' onSubmit={form.handleSubmit(onSubmit)} method='post' className='w-full grid gap-6 relative'>
				{(form.formState.isSubmitting || isPending) && <LoaderInstElement />}
				{formSections_coupon.map((section, sectionIndex) => (
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
					formId='coupon-form'
					resetForm={() => form.reset(defaultValues)}
				/>
			</form>
		</Form>
	);
}

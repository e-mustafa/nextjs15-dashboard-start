'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { DefaultValues, FieldValues, Path, SubmitHandler, useForm } from 'react-hook-form';
import { ZodObject, ZodType } from 'zod';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthFormType, GeneralLinks } from '@/constant/enums';
import { FIELD_DATA } from '@/constant/inputs-constants';
import { cn, renderErrorMessage } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';
// import { Tt } from '@/validation/auth-validation';
import { isDEV } from '@/configs/general';
import { signupAction } from '@/server/actions/auth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import ShowHidePasswordButton from '../inputs/show-hide-password-button';

export interface Props<T extends FieldValues> {
	schema: () =>
		| ZodObject<T extends object ? T : Record<string, unknown>>
		| ZodType<T extends object ? T : Record<string, unknown>>;
	defaultValues: T;
	onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
	type: AuthFormType;
}

export default function AuthForm<T extends FieldValues>({ type, schema, defaultValues, onSubmit }: Props<T>) {
	const isSignIn = type === AuthFormType.SIGN_IN;
	const locale = useTranslation().i18n.language;
	const { t } = useTranslation();
	const router = useRouter();

	const [inputsError, setInputsError] = useState({});

	const [showPassword, setShowPassword] = useState(false as boolean);

	const form = useForm({
		resolver: zodResolver(schema() as ZodType<T extends object ? T : Record<string, unknown>, FieldValues>),
		defaultValues: defaultValues as DefaultValues<T>,
	});

	// Handle form submission
	const handleSubmit: SubmitHandler<T extends object ? T : Record<string, unknown>> = async (data) => {
		console.log('data', data);
		// onSubmit(data, locale);
		try {
			const res = isSignIn
				? await signIn('credentials', { redirect: false, email: data.email, password: data.password })
				: await signupAction(data, locale);

			console.log('next auth res', res);

			// if (res && typeof res === 'object' && 'error' in res && res.error) {
			if (!res?.success || res?.error || !res?.ok) {
				// const error = JSON.parse(res.error);
				const error = res.error;
				console.log('error111', error);

				if (error.responseError) {
					isDEV && console.log('responseError', error.responseError);
					toast.error(error.responseError);
				} else if (error.validationError) {
					setInputsError(error.validationError);
					console.log('validationError', error.validationError);
				} else {
					toast.error(error || res?.message);
				}
				toast.error(error || res?.message);
			}

			if (res?.success || res?.ok) {
				toast.success(
					res?.message
						? res?.message
						: isSignIn
						? t('messages.successes.sign_in_success')
						: t('messages.successes.sign_up_success')
				);
			}
		} catch (error) {
			console.error('Error signing in:', error);
		}
	};

	return (
		<div className='w-full flex flex-col gap-4'>
			<h1 className='text-2xl font-semibold text-primary text-center'>
				{isSignIn ? t('auth.sign_in_title') : t('auth.sign_up_title')}
			</h1>
			<p className='text-muted-foreground'>{isSignIn ? t('auth.sign_in_description') : t('auth.sign_up_description')}</p>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
					{/* {Object.entries.defaultValues.map(([key, value]) => ( */}
					{Object.keys(defaultValues).map((field, index) => {
						const errorMessage = form.formState.errors?.[field as keyof typeof defaultValues]?.message;
						const fieldData = FIELD_DATA[field as unknown as keyof typeof FIELD_DATA];

						return (
							<FormField
								error={errorMessage}
								key={field}
								control={form.control}
								name={field as Path<T>}
								render={({ field }) => (
									<FormItem>
										<FormLabel className={cn('capitalize', fieldData.isRequired && 'required')}>
											{t(fieldData?.label)}
										</FormLabel>
										<div className='relative'>
											<FormControl>
												<Input
													type={
														fieldData?.type == 'password'
															? showPassword
																? 'text'
																: 'password'
															: fieldData?.type
													}
													placeholder={t(fieldData?.placeholder)}
													className={cn(
														!!fieldData?.startIcon && 'ps-9',
														(!!fieldData?.endIcon || field.name == 'password') && 'pe-9'
													)}
													autoFocus={index === 0}
													{...field}
												/>
											</FormControl>

											{!!fieldData?.startIcon && (
												<fieldData.startIcon className='absolute top-1/2 -translate-y-1/2 start-2 me-2 size-5 text-muted-foreground' />
											)}

											{field.name == 'password' && (
												<ShowHidePasswordButton
													showPassword={showPassword}
													setShowPassword={setShowPassword}
													t={t}
												/>
											)}

											{/* {!!fieldData?.endIcon && (
												<fieldData.endIcon className='absolute top-1/2 -translate-y-1/2 end-2 me-2 size-5 text-muted-foreground' />
											)} */}
										</div>
										{/* <FormMessage /> */}

										{/* {errorMessage && <FormMessage>{translatedMessage}</FormMessage>} */}

										{errorMessage && (
											<p className='text-sm text-destructive'>
												{t(renderErrorMessage(errorMessage as string, t))}
											</p>
										)}
									</FormItem>
								)}
							/>
						);
					})}

					{/* {form.formState.errors.username && (
						<p className='text-destructive text-sm'>{form.formState.errors.username.message}</p>
					)} */}

					<Button type='submit' className='w-full'>
						{form.formState.isSubmitting ? (
							<>
								<span className='text-sm text-muted-foreground'>{t('auth.processing')}</span>
								<span className='animate-spin ml-2'>
									<Loader2Icon className='h-4 w-4' />
								</span>
							</>
						) : isSignIn ? (
							t('auth.sign_in')
						) : (
							t('auth.sign_up')
						)}
					</Button>
				</form>
			</Form>

			{isSignIn && (
				<Link
					href={GeneralLinks.FORGOT_PASSWORD}
					className='text-sm text-muted-foreground hover:text-primary font-medium'
				>
					{t('auth.forgot_password_title')}
				</Link>
			)}

			<div className='flex items-center justify-center'>
				<p className='text-sm text-muted-foreground font-medium'>
					{isSignIn ? t('auth.have_no_account') : t('auth.have_account')}
				</p>

				<Button variant='link' size='sm' className='px-1.5' asChild>
					<Link href={isSignIn ? GeneralLinks.SIGN_UP : GeneralLinks.SIGN_IN}>
						{isSignIn ? t('auth.sign_up') : t('auth.sign_in')}
					</Link>
				</Button>
			</div>

			{/* <ImageUpload /> */}
			{/* <ImageManager
				multiple={true}
				folder='/products'
				onChange={(files) => {
					console.log('Selected files', files);
				}}
			/> */}
		</div>
	);
}

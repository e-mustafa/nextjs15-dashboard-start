'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DefaultValues, FieldValues, Path, SubmitHandler, useForm } from 'react-hook-form';
import { ZodType } from 'zod';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui-custom/custom-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { seoData } from '@/configs/SEOData';
import { defaultLocale } from '@/configs/general';
import { AuthFormType, GeneralLinks } from '@/constant/enums-development';
import { FIELD_DATA } from '@/constant/inputs-constants';
import { cn, renderErrorMessage } from '@/lib/utils';
import { FigmaIcon, GithubIcon, InstagramIcon, Loader2Icon, TwitchIcon, TwitterIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import ShowHidePasswordButton from '../inputs/show-hide-password-button';
import { Separator } from '../ui/separator';

export type AuthResponse =
	| {
			success: boolean;
			ok?: boolean;
			error?: string;
			message?: string;
			data?: any;
	  }
	| {
			ok: boolean;
			error?: string;
			status?: number;
			url?: string | null;
			message?: string;
			data?: any;
	  };

interface Props<T extends FieldValues> {
	schema: ZodType<T, any, any>;
	defaultValues: DefaultValues<T>;
	// onSubmit: (data: T) => Promise<{ success: boolean; error?: string; message?: string; ok?: boolean } | void>;
	onSubmit: (data: T, locale: string) => Promise<AuthResponse>;
	type: AuthFormType;
}

export default function AuthForm<T extends FieldValues>({ type, schema, defaultValues, onSubmit }: Props<T>) {
	const isSignIn = type === AuthFormType.SIGN_IN;
	const isSignUp = type === AuthFormType.SIGN_UP;

	const { t, i18n } = useTranslation();
	const locale = i18n.language;
	const router = useRouter();

	const localeKey = locale as keyof typeof seoData;

	const [inputsError, setInputsError] = useState<Record<string, string>>({});
	const [showPassword, setShowPassword] = useState(false);

	const form = useForm<T>({
		resolver: zodResolver(schema),
		defaultValues,
	});

	const handleSubmit: SubmitHandler<T> = async (data) => {
		setInputsError({});
		form.clearErrors();

		try {
			const res = isSignIn
				? ((await signIn('credentials', {
						redirect: false,
						email: (data as any).email,
						password: (data as any).password,
				  })) as AuthResponse | undefined)
				: ((await onSubmit(data, locale)) as AuthResponse | undefined);

			console.log('res: ', res);

			if (!res) return;

			if ('success' in res && !res.success) {
				if (res.error) {
					if (typeof res.error === 'object') setInputsError(res.error);
					if (typeof res.error === 'string') toast.error(t(res.error));
				}
				// if (res.message) toast.error(t(res.message));
				return;
			}

			if ('ok' in res && !res.ok) {
				const error = JSON.parse(res.error as string);
				toast.error(t(error.responseError));
				return;
			}

			// success
			if (('ok' in res && res?.ok) || ('success' in res && res?.success)) {
				toast.success(
					res?.message ?? (isSignIn ? t('messages.successes.sign_in_success') : t('messages.successes.sign_up_success'))
				);
			}

			if (isSignIn) router.push('/');
		} catch (error) {
			console.error('Auth error:', error);
			toast.error(t('messages.errors.error'));
		}
	};

	return (
		<div className='w-full flex flex-col gap-4'>
			<h1 className='text-2xl font-semibold text-primary text-center'>
				{isSignIn && `${t('auth.sign_in_title')} ${t('auth.i_to')} `}
				{isSignUp && `${t('auth.sign_up_title')} ${t('auth.i_in')} `}
				<strong>{seoData[localeKey || defaultLocale.short]?.title}</strong>
			</h1>

			<p className='text-sm text-muted-foreground '>
				{
					<>
						{isSignIn && t('auth.sign_in')}
						{isSignUp && t('auth.sign_up')} {t('auth.i_by')}:
					</>
				}
			</p>
			<div className='flex items-center justify-center gap-3'>
				<Button variant='outline' size='icon' className='rounded-full size-10'>
					<GithubIcon className='!size-5' />
				</Button>
				<Button variant='outline' size='icon' className='rounded-full size-10'>
					<InstagramIcon className='!size-5' />
				</Button>
				<Button variant='outline' size='icon' className='rounded-full size-10'>
					<TwitterIcon className='!size-5' />
				</Button>
				<Button variant='outline' size='icon' className='rounded-full size-10'>
					<FigmaIcon className='!size-5' />
				</Button>
				<Button variant='outline' size='icon' className='rounded-full size-10'>
					<TwitchIcon className='!size-5' />
				</Button>
			</div>

			<div className='w-full flex items-center justify-center overflow-hidden'>
				<Separator />
				<span className='text-sm px-2'>{t('auth.i_or')}</span>
				<Separator />
			</div>

			<p className='text-muted-foreground'>{isSignIn ? t('auth.sign_in_description') : t('auth.sign_up_description')}</p>

			<Form {...form}>
				{/* as SubmitHandler<FieldValues> */}
				<form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
					{Object.keys(defaultValues).map((field, index) => {
						const errorMessage = form.formState.errors?.[field as keyof T]?.message || inputsError?.[field];
						const fieldData = FIELD_DATA[field as keyof typeof FIELD_DATA];
						if (!fieldData) return null;

						return (
							<FormField
								// error={errorMessage}
								key={field}
								control={form.control}
								name={field as Path<T>}
								render={({ field }) => (
									<FormItem>
										<FormLabel className={cn('capitalize', fieldData.isRequired && 'required')}>
											{t(fieldData.label)}
										</FormLabel>
										<div className='relative'>
											<FormControl>
												<Input
													type={
														fieldData.type === 'password'
															? showPassword
																? 'text'
																: 'password'
															: fieldData.type
													}
													placeholder={t(fieldData.placeholder)}
													className={cn(
														!!fieldData.startIcon && 'ps-9',
														(!!fieldData.endIcon || field.name.includes('password')) && 'pe-9'
													)}
													autoFocus={index === 0}
													{...field}
												/>
											</FormControl>

											{!!fieldData.startIcon && (
												<fieldData.startIcon className='absolute top-1/2 -translate-y-1/2 start-2 me-2 size-5 text-muted-foreground' />
											)}

											{field.name.includes('password') && (
												<ShowHidePasswordButton
													showPassword={showPassword}
													setShowPassword={setShowPassword}
													t={t}
												/>
											)}
										</div>

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
		</div>
	);
}

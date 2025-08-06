'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { DefaultValues, FieldValues, Path, SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import { ZodType } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface props<T extends FieldValues> {
	schema: ZodType<T>;
	// onSubmit: SubmitHandler<T>;
	onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
	defaultValues: DefaultValues<T>;
	type: 'SIGN_UP' | 'SIGN_IN';
}

export default function AuthForm<T extends FieldValues>({ type, schema, defaultValues, onSubmit }: props<T>) {
	const isSignIn = type === 'SIGN_IN';
	const { t } = useTranslation();
	console.log('t', t);

	const form: UseFormReturn<T> = useForm({
		resolver: zodResolver(schema),
		defaultValues: defaultValues as DefaultValues<T>,
	});

	// Handle form submission
	const handleSubmit: SubmitHandler<T> = (data) => {};

	return (
		<div className='flex flex-col gap-4 gradient-blue'>
			<h1 className='text-2xl font-semibold text-primary'>
				{isSignIn ? t('auth.sign_in_title') : t('auth.sign_up_title')}
			</h1>
			<p className='text-muted-foreground'>{isSignIn ? t('auth.sign_in_description') : t('auth.sign_up_description')}</p>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
					{/* {Object.entries.defaultValues.map(([key, value]) => ( */}
					{Object.keys.defaultValues.map((field) => (
						<FormField
							key={field}
							control={form.control}
							name={field as Path<T>}
							render={({ field }) => (
								<FormItem>
									<FormLabel className='capitalize'>{key}</FormLabel>
									<FormControl>
										<Input placeholder={value} {...field} />
									</FormControl>
									<FormDescription>{key}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					))}

					{/* {form.formState.errors.username && (
						<p className='text-destructive text-sm'>{form.formState.errors.username.message}</p>
					)} */}

					<FormField
						control={form.control}
						name='username'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username</FormLabel>
								<FormControl>
									<Input placeholder='shadcn' {...field} />
								</FormControl>
								<FormDescription>This is your public display name.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type='submit'>Submit</Button>
				</form>
			</Form>

			{isSignIn && (
				<Link href='/auth/forgot-password' className='text-sm text-muted-foreground'>
					{t('auth.forgot_password_title')}
				</Link>
			)}

			<div className='flex items-center justify-center'>
				<p className='text-sm text-muted-foreground font-medium'>
					{isSignIn ? t('auth.have_no_account') : t('auth.have_account')}
				</p>

				<Button variant='link' size='sm' className='px-1.5' asChild>
					<Link href={isSignIn ? '/auth/sign-up' : '/auth/sign-in'}>
						{isSignIn ? t('auth.sign_up') : t('auth.sign_in')}
					</Link>
				</Button>
			</div>
		</div>
	);
}

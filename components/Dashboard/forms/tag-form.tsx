'use client';
import { Button } from '@/components/ui-custom/custom-button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessageTranslated,
} from '@/components/ui-custom/custom-form';
import { Input } from '@/components/ui/input';
import { config_env } from '@/configs/general';
import { useFormResponse } from '@/hooks/use-form-response';
import { slugify } from '@/lib/slugify';
import { ActionResult } from '@/types/api';
import { formSchemaTag, TTagFormValues } from '@/validation/tag-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type Props = {
	defaultValue?: string;
	onSuccess?: (tag: TTagFormValues) => void;
};

export default function TagForm({ defaultValue = '', onSuccess }: Props) {
	const { t } = useTranslation();

	const form = useForm<TTagFormValues>({
		resolver: zodResolver(formSchemaTag),
		defaultValues: {
			name: defaultValue,
			slug: slugify(defaultValue),
		},
	});

	const [isPending, startTransition] = useTransition();
	const [result, setResult] = useState<ActionResult<TTagFormValues> | null>(null);

	console.log('result tag', result);

	useFormResponse<TTagFormValues>(result!, form, {
		reset_on_success: (result?.data as TTagFormValues) || true,
	});

	async function handleSubmit(data: TTagFormValues) {
		startTransition(async () => {
			try {
				const result = await fetch(`${config_env.domainAPI}/dashboard/tags`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				}).then((r) => r.json());

				setResult(result);

				if (result?.success && onSuccess) {
					onSuccess(result.data);
				}
			} catch (error) {
				console.error('Tag creation failed:', error);
			}
		});
	}

	useEffect(() => {
		const subscription = form.watch((value, { name }) => {
			if (name === 'name') {
				form.setValue('slug', slugify(value.name || ''), { shouldValidate: true });
			}
		});
		return () => subscription.unsubscribe();
	}, [form]);

	return (
		<Form {...form}>
			<form
				id='tag-form'
				onSubmit={form.handleSubmit(handleSubmit)}
				className='flex items-center gap-2 p-2 bg-muted rounded-md'
			>
				<FormField
					control={form.control}
					name='name'
					render={({ field }) => (
						<FormItem>
							<FormLabel aria-required='true'>{t('forms.labels.tag')}</FormLabel>
							<FormControl>
								<Input type='text' placeholder={t('forms.placeholders.tag')} {...field} />
							</FormControl>
							{/* <FormMessageTranslated /> */}
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='slug'
					render={({ field }) => (
						<FormItem>
							<FormLabel aria-required='true'>{t('forms.labels.tag_slug')}</FormLabel>
							<FormControl>
								<Input
									type='text'
									placeholder={t('forms.placeholders.tag_slug')}
									{...field}
									onChange={(e) => form.setValue('slug', e.target.value, { shouldValidate: true })}
								/>
							</FormControl>
							{/* <FormMessageTranslated /> */}
						</FormItem>
					)}
				/>

				<Button
					type='button'
					form='tag-form'
					onClick={() => form.handleSubmit(handleSubmit)()}
					disabled={isPending || form.formState.isSubmitting}
				>
					{t('common.actions.add')}
				</Button>
			</form>
		</Form>
	);
}

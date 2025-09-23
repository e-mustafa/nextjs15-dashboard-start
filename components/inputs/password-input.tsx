import { RenderFieldProps } from '@/lib/create-forms/types copy';
import { useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessageTranslated,
} from '../ui-custom/custom-form';
import { Input } from '../ui/input';
import ShowHidePasswordButton from './show-hide-password-button';

export default function PasswordInput({
	fieldConfig: { name, label, placeholder, required, description },
	form,
}: RenderFieldProps<FieldValues>) {
	const { t } = useTranslation();
	const [showPassword, setShowPassword] = useState<boolean>(false);

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
					<FormControl>
						<div className='relative'>
							<Input
								placeholder={t(placeholder as string)}
								type={showPassword ? 'text' : 'password'}
								className='pe-10'
								{...field}
							/>
							<div className='absolute top-1/2 -translate-y-1/2 end-0 ms-2 size-5 text-muted-foreground'>
								<ShowHidePasswordButton showPassword={showPassword} setShowPassword={setShowPassword} t={t} />
							</div>
						</div>
					</FormControl>

					{description && <FormDescription>{t(description as string)}</FormDescription>}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

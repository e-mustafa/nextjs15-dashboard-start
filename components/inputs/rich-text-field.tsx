import { FieldConfig } from '@/lib/create-forms/types-create-forms';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { RichTextInput } from '../Dashboard/rich-text-editor/rich-text-input';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessageTranslated,
} from '../ui-custom/custom-form';

type RichTextFieldProps<T extends FieldValues> = {
	fieldConfig: FieldConfig<T, 'richtext'>;
	form: UseFormReturn<T>;
};

export default function RichTextField<T extends FieldValues>({
	fieldConfig: { name, label, placeholder, description, required },
	form,
}: RichTextFieldProps<T>) {
	const { t } = useTranslation();

	return (
		<div className='grid gap-2'>
			<FormField
				control={form.control}
				name={name}
				render={({ field }) => (
					<FormItem>
						<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
						<FormControl>
							<RichTextInput
								// value={form.watch(name)}
								// onChange={(val) => form.setValue(name, val as PathValue<T, typeof name>)}
								placeholder={t(placeholder as string)}
								{...field}
							/>
						</FormControl>

						{description && <FormDescription>{t(description)}</FormDescription>}

						<FormMessageTranslated />
					</FormItem>
				)}
			/>
		</div>
	);
}

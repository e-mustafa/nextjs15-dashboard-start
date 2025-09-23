import { FieldConfig } from '@/lib/create-forms/types-create-forms';
import { FieldValues, PathValue, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { RichTextInput } from '../Dashboard/rich-text-editor/rich-text-input';
import { Label } from '../ui/label';

type RichTextFieldProps<T extends FieldValues> = {
	fieldConfig: FieldConfig<T, 'richtext'>;
	form: UseFormReturn<T>;
};

export default function RichTextField<T extends FieldValues>({
	fieldConfig: { name, label, placeholder, ...fieldConfig },
	form,
}: RichTextFieldProps<T>) {
	const { t } = useTranslation();

	return (
		<div className='grid gap-2'>
			<Label aria-required={!!fieldConfig.required}>{t(label as string)}</Label>
			<RichTextInput
				value={form.watch(name)}
				onChange={(val) => form.setValue(name, val as PathValue<T, typeof name>)}
				placeholder={t(placeholder as string)}
			/>
		</div>
	);
}

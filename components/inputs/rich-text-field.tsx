import { FieldConfig } from '@/lib/create-forms/types-create-forms';
import { cn } from '@/lib/utils';
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

/**
 * Rich text input field
 *
 * @param {Object} fieldConfig - contains the field name, attributesName, skuName, label, description, required flag, and attributes name
 * @param {Object} form - contains the form control and values
 * @returns {JSX.Element} - renders the rich text input field component
 *
 * @example
 * <RichTextField
 *  fieldConfig={{ name: 'description', label: 'Description', placeholder: 'Enter description', description: 'Enter description', required: true }}
 *  form={{ control, values }}
 * />
 * @return
 * <div className='grid gap-2'>
 *  <FormField>
 *    <FormItem>
*      <FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
*      <FormControl>
*        <RichTextInput
*          placeholder={t(placeholder as string)}
*          {...field}
*        />
*      <FormDescription>{t(description)}</FormDescription>
*
*    <FormMessageTranslated />
*  </FormItem>
* </div>
*/
export default function RichTextField<T extends FieldValues>({
	fieldConfig: { name, label, placeholder, description, required, ...fieldConfig },
	form,
}: RichTextFieldProps<T>) {
	const { t } = useTranslation();

	return (
		<div className={cn('grid gap-2', fieldConfig.class)}>
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

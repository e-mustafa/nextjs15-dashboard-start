import { FieldTypeMap, RenderFieldProps } from '@/lib/create-forms/types-create-forms';
import { JSX } from 'react';
import { FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormDescription, FormField, FormItem, FormLabel, FormMessageTranslated } from '../ui-custom/custom-form';
import SEOMockupCard from './seo-mockup';

export default function seoMockupField<T extends FieldValues, K extends FieldTypeMap>({
	fieldConfig: { name, label, placeholder, required, description, ...fieldConfig },
	form,
}: RenderFieldProps<T, K>): JSX.Element {
	const { t } = useTranslation();

	const data = {
		ar: {
			title: form.watch('seoTitle_ar' as Path<T>),
			description: form.watch('seoDescription_ar' as Path<T>),
			slug: form.watch('slug_ar' as Path<T>),
		},
		en: {
			title: form.watch('seoTitle_en' as Path<T>),
			description: form.watch('seoDescription_en' as Path<T>),
			slug: form.watch('slug_en' as Path<T>),
		},
	};
	const image = form.watch('seoImage' as Path<T>)?.[0]?.url || form.watch('images' as Path<T>)?.[0]?.url;

	return (
		<FormField
			control={form.control}
			name={name}
			render={() => (
				<FormItem className={fieldConfig.class}>
					<FormLabel aria-required={!!required}>{t(label as string)}</FormLabel>
					<SEOMockupCard data={data} image={image} />;
					{description && <FormDescription>{t(description as string)}</FormDescription>}
					<FormMessageTranslated />
				</FormItem>
			)}
		/>
	);
}

'use client';

import initTranslations from '@/app/i18n';
import { TLocalesData } from '@/configs/general';
import { createInstance, i18n } from 'i18next';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

interface Props {
	children: React.ReactNode;
	locale: TLocalesData;
	namespaces: string[];
	resources: any;
}

export default function TranslationsProvider({ children, locale, namespaces, resources }: Props) {
	const [i18nInstance, setI18nInstance] = useState<i18n | null>(null);

	useEffect(() => {
		const i18n = createInstance();
		initTranslations(namespaces, locale, i18n, resources).then(() => {
			setI18nInstance(i18n);
		});
	}, [locale, namespaces, resources]);

	if (!i18nInstance) return null; // Optional: يمكن عرض spinner مؤقتًا

	return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}

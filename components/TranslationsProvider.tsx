'use client';

import initTranslations from '@/app/i18n';
import { TLocalesData } from '@/configs/general';
import { createInstance, i18n, Resources } from 'i18next';
import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

interface Props {
	children: ReactNode;
	i18n?: i18n;
	locale: TLocalesData;
	namespaces: string[];
	resources?: Resources;
}

export default function TranslationsProvider({ children, locale, namespaces, resources }: Props) {
	const i18n = createInstance();
	initTranslations(namespaces, locale, i18n, resources);

	return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

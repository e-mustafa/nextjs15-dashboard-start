'use client';

import { useTranslation } from 'react-i18next';

export default function ExampleClientComponent() {
	const { t } = useTranslation();

	return <h3>{t('welcome_message')}</h3>;
}

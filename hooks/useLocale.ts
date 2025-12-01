// hooks/useLocale.ts
import { TLocalesData } from '@/configs/general';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function useLocale() {
	const { i18n } = useTranslation();
	const [dir, setDir] = useState<'rtl' | 'ltr'>('ltr');

	useEffect(() => {
		const currentLang = i18n.language;
		setDir(i18n.dir(currentLang));
		// document.documentElement.lang = currentLang;
		// document.documentElement.dir = i18n.dir(currentLang);
	}, [i18n.language]);

	return {
		locale: i18n.language as TLocalesData,
		dir,
		t: i18n.t,
		i18n,
	};
}


// const { locale, dir, t, i18n } = useLocale();
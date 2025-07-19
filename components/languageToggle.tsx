'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { defaultLocale, localesData, type LocalesData } from '@/configs/general';
import i18nConfig from '@/i18nConfig';

export function LanguageToggle() {
	const { i18n, t } = useTranslation();
	const router = useRouter();
	const pathname = usePathname();

	const currentLocale = i18n.language as LocalesData;
	const [selectedLocale, setSelectedLocale] = useState<LocalesData>(currentLocale);

	// get the stored language from localStorage and set it to the selectedLocale state
	useEffect(() => {
		const storedLang = localStorage.getItem('App-Language') as LocalesData | null;

		if (storedLang && storedLang !== currentLocale) {
			i18n.changeLanguage(storedLang);
			setSelectedLocale(storedLang);

			const newPath =
				currentLocale === i18nConfig.defaultLocale && !i18nConfig.prefixDefault
					? `/${storedLang}${pathname}`
					: pathname.replace(`/${currentLocale}`, `/${storedLang}`);

			router.push(newPath);
		}
	}, []);

	const handleSelect = (newLocale: LocalesData) => {
		if (newLocale === currentLocale) return;

		localStorage.setItem('App-Language', newLocale);
		setSelectedLocale(newLocale);
		i18n.changeLanguage(newLocale);

		const newPath =
			currentLocale === i18nConfig.defaultLocale && !i18nConfig.prefixDefault
				? `/${newLocale}${pathname}`
				: pathname.replace(`/${currentLocale}`, `/${newLocale}`);

		router.push(newPath);
		router.refresh();
	};

	const localeData = localesData[selectedLocale] || defaultLocale;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				title={`${t('select')}${t('language-preview')}`}
				className='flex items-center gap-2 px-3 py-2 border rounded'
			>
				<Image src={localeData.flag} alt={localeData.label} width={25} height={20} className='rounded' />
				<span>{localeData.label}</span>
			</DropdownMenuTrigger>

			<DropdownMenuContent className='w-40'>
				{Object.entries(localesData).map(([key, data]) => (
					<DropdownMenuItem
						key={key}
						onClick={() => handleSelect(data.short as LocalesData)}
						className='flex items-center justify-between rtl:flex-row-reverse'
					>
						<div className='flex items-center gap-2 rtl:flex-row-reverse capitalize'>
							<Image src={data.flag} alt={data.label} width={25} height={20} className='rounded' />
							<span>{data.label}</span>
						</div>
						{selectedLocale === data.short && <span>✓</span>}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { defaultLocale, localesData, TLocalesData } from '@/configs/general';
import i18nConfig from '@/i18n.Config';

export function LanguageToggle() {
	const { i18n, t } = useTranslation();
	const router = useRouter();
	const pathname = usePathname();

	const currentLocale = i18n.language as TLocalesData;
	const [selectedLocale, setSelectedLocale] = useState<TLocalesData>(currentLocale);

	// ✅ get locale from URL
	useEffect(() => {
		const urlLocale = pathname.split('/')[1] as TLocalesData;
		const finalLocale = i18nConfig.locales.includes(urlLocale) && urlLocale ? urlLocale : i18nConfig.defaultLocale;

		if (i18n.language !== finalLocale) {
			i18n.changeLanguage(finalLocale);
		}

		setSelectedLocale(finalLocale);
		localStorage.setItem('App-Language', finalLocale);
	}, [pathname, i18n.language]);

	const handleSelect = (newLocale: TLocalesData) => {
		if (newLocale === selectedLocale) return;

		localStorage.setItem('App-Language', newLocale);
		setSelectedLocale(newLocale);
		i18n.changeLanguage(newLocale);

		const newPath =
			selectedLocale === i18nConfig.defaultLocale && !i18nConfig.prefixDefault
				? `/${newLocale}${pathname}`
				: pathname.replace(`/${selectedLocale}`, `/${newLocale}`);

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
						onClick={() => handleSelect(data.short as TLocalesData)}
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

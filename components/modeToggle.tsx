'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ModeToggle() {
	const { themes, theme, setTheme } = useTheme();
	const { t } = useTranslation();

	console.log('themes', themes);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='outline' size='icon' title={t('select') + t('theme')}>
					<Sun className='size-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0' />
					<Moon className='absolute size-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100' />
					<span className='sr-only'>{t('select') + t('theme')}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className='w-40 min-w-fit' align='center'>
				{themes.map((themeName) => (
					<DropdownMenuItem
						key={themeName}
						onClick={() => setTheme(themeName)}
						className='flex items-center justify-between gap-4 rtl:flex-row-reverse capitalize'
					>
						<span>{t(themeName + 'Mode')}</span>
						{theme === themeName && <span>✓</span>}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

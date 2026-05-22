'use client';
import { Button } from '@/components/ui-custom/custom-button';
import useLocale from '@/hooks/useLocale';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';

interface IHeadSectionCreate {
	link: string;
	title: string;
	name?: string;
}

export default function HeadSectionCreate({ link, title, name }: IHeadSectionCreate) {
	const { dir } = useLocale();
	console.log('dir()', dir);
	return (
		<div className='flex gap-2 items-center'>
			<Button asChild variant='ghost' size='icon'>
				<Link href={link}>
					<ArrowRightIcon className={`size-6 text-muted-foreground ${dir === 'ltr' && '-rotate-180'}`} />
				</Link>
			</Button>
			{title + (name ? ' : ' : '')}
			{name && <span className='capitalize font-semibold'>{name}</span>}
		</div>
	);
}

import { Button } from '@/components/ui-custom/custom-button';
import { FilePlusIcon } from 'lucide-react';
import Link from 'next/link';

interface IHeadSectionCreate {
	link: string;
	title: string;
	btnTitle: string;
}

export default function HeadSectionGeneral({ title, link, btnTitle }: IHeadSectionCreate) {
	return (
		<div className='stack-component flex-wrap'>
			<h1>{title}</h1>

			<Button asChild className='ms-auto'>
				<Link href={link}>
					<FilePlusIcon />
					{btnTitle}
				</Link>
			</Button>
		</div>
	);
}

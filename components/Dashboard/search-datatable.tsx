import { Label } from '@/components/ui/label';
import { SidebarInput } from '@/components/ui/sidebar';
import { SearchIcon } from 'lucide-react';

export function SearchDataTable({ ...props }: React.ComponentProps<'form'>) {
	return (
		<form {...props}>
			<div className='relative'>
				<Label htmlFor='search' className='sr-only'>
					Search
				</Label>
				<SidebarInput id='search' placeholder='Search the docs...' className='pl-8' />
				<SearchIcon className='pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none' />
			</div>
		</form>
	);
}

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

// =================================
// REUSABLE SELECT
// =================================

type TItem = {
	id: string;
	title_ar?: string;
	title_en?: string;
};

/**
 * Reusable select component
 *
 * @param `items` - Array of items to be selected from.
 * @param `value` - Currently selected value.
 * @param `onChange` - Function to be called when value changes.
 * @param `placeholder` - Placeholder text for the select.
 * @param `sectorProperty_1` - Property of item to be used for the first sector.
 * @param `sectorProperty_2` - Property of item to be used for the fullback sector.
 * @param `noneItem` - Item to be displayed when no item is selected.
 *
 * @returns {JSX.Element}
 */
export default function ReusableSelect<T extends TItem>({
	items,
	value,
	onChange,
	placeholder = 'common.actions.select_item',
	sectorProperty_1 = 'title_ar',
	sectorProperty_2 = 'title_en',
	noneItem = 'common.actions.none',
}: {
	items: T[];
	value?: string;
	onChange: (v: string | undefined) => void;
	placeholder?: string;
	sectorProperty_1?: keyof T;
	sectorProperty_2?: keyof T;
	noneItem?: string | boolean;
}) {
	const { t } = useTranslation();

	return (
		<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? undefined : v)}>
			<SelectTrigger className='w-[200px] rtl:flex-row-reverse'>
				<SelectValue placeholder={t(placeholder)} />
			</SelectTrigger>
			<SelectContent className='rtl:flex-row-reverse'>
				<SelectGroup>
					{!!noneItem && (
						<SelectItem value='none' className='rtl:flex-row-reverse'>
							{t(noneItem as string) || 'None'}
						</SelectItem>
					)}
					{items
						?.filter((v) => v[sectorProperty_1] || v[sectorProperty_2])
						.map((item) => (
							<SelectItem
								key={item.id}
								value={`${item?.[sectorProperty_1] || ''} - ${item?.[sectorProperty_2] || ''}`}
								className=' rtl:flex-row-reverse'
							>
								{`${item?.[sectorProperty_2] || ''} - ${item?.[sectorProperty_1] || ''}`}
							</SelectItem>
						))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

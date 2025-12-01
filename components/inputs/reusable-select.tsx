import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// =================================
// REUSABLE SELECT
// =================================

type TItem = { [key: string]: any };

/**
 * Reusable select component
 *
 * @param `items` - Array of items to be selected from.
 * @param `value` - Currently selected value.
 * @param `onChange` - Function to be called when value changes.
 * @param `placeholder` - Placeholder text for the select.
 * @param `sectorProperty_1` - Property of item to be used for the first sector default is `value`.
 * @param `sectorProperty_2` - Property of item to be used for the fullback sector.
 * @param `noneItem` - Item to be displayed when no item is selected.
 *
 * @returns {JSX.Element}
 */
export default function ReusableSelect<T extends TItem>({
	items = [],
	value,
	onChange,
	placeholder = 'common.actions.select_item',
	sectorProperty_1 = 'value',
	sectorProperty_2,
	noneItem = 'common.actions.none',
	className,
}: {
	items: T[];
	value?: string;
	onChange: (v: string | undefined) => void;
	placeholder?: string;
	sectorProperty_1?: keyof T | string;
	sectorProperty_2?: keyof T | string;
	noneItem?: string | boolean;
	className?: string;
}) {
	const { t } = useTranslation();

	return (
		<Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? undefined : v)}>
			<SelectTrigger className={cn('rtl:flex-row-reverse dark:bg-input/30', className)}>
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
						?.filter((v) => v[sectorProperty_1] || (sectorProperty_2 && v[sectorProperty_2]))
						.map((item, index) => (
							<SelectItem
								key={item.id || `option-${index}`}
								value={
									(sectorProperty_2
										? `${item?.[sectorProperty_1] || ''} - ${item?.[sectorProperty_2] || ''}`
										: item?.[sectorProperty_1]) as string
								}
								className=' rtl:flex-row-reverse'
							>
								{sectorProperty_2
									? `${item?.[sectorProperty_2] || ''} - ${item?.[sectorProperty_1] || ''}`
									: item?.label
									? t(String(item?.label ?? ''))
									: `${item?.[sectorProperty_1] || ''}`}
							</SelectItem>
						))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

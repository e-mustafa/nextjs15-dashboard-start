import { currenciesData, TLocalesData } from '@/configs/general';
import { SaudiRiyalIcon } from 'lucide-react';

export function formatMoney(amount: string | number, currency = 'EGP', locale: TLocalesData = 'en') {
	amount = Number(amount);
	// const formatter = new Intl.NumberFormat('en-US', {

	if (isNaN(amount)) {
		return '';
	}

	// if (currency === 'SAR') {}
	const formatter = new Intl.NumberFormat(`${locale}`, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

	return (
		<span className='flex items-center gap-1 text-inherit' style={{ fontSize: 'inherit' }}>
			{currency === 'SAR' && <SaudiRiyalIcon />}
			<span>{currency === 'EGP' ? currenciesData.egp.symbol : currenciesData.usd.symbol}</span>
			{formatter.format(amount)}
		</span>
	);

	// const formatter = new Intl.NumberFormat(`${locale}-EG`, {
	// 	style: 'currency',
	// 	// currency: 'USD',
	// 	currency,
	// 	currencyDisplay: 'narrowSymbol',
	// 	currencySign: 'standard',
	// 	signDisplay: 'auto',
	// 	maximumFractionDigits: 2,
	// 	minimumFractionDigits: 2,

	// 	// currency: currenciesData.egp.symbol,
	// });
	// return formatter.format(parseFloat(amount.toString()));
}

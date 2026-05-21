import initTranslations from '@/app/i18n';
import BreadcrumbDashboard from '@/components/Dashboard/breadcrumb-dashboard';
import LoaderBlock from '@/components/shard/loaders/loader-block';
import { Button } from '@/components/ui-custom/custom-button';
import { TLocalesData } from '@/configs/general';
import { EnumFormTypes } from '@/constant/enums-development';
import { getDataInPage } from '@/lib/utils.server/api.server';
import { TCouponFormValues } from '@/validation/coupon-validation';
import { ArrowRightIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ReactNode, Suspense } from 'react';
import { i18nNamespaces, tags, url_segment } from '../page';

const CouponForm = dynamic(() => import('@/components/Dashboard/forms/coupon-form'), {
	// ssr: false,
});

export interface TDRouteProps {
	children: ReactNode;
	params: { locale: TLocalesData; id: string };
}

export default async function UpdateCouponsPage({ params }: TDRouteProps) {
	const { locale, id } = await params;
	const { t } = await initTranslations(i18nNamespaces, locale);

	const result = await getDataInPage<TCouponFormValues>({ url_segment, id, locale, tags });

	return (
		<div className='page-component flex-col'>
			<BreadcrumbDashboard lastPath={t('breadcrumbs.edit_coupon')} />
			<div className='flex gap-2 items-center'>
				<Button asChild variant='ghost' size='icon'>
					<Link href={`/${url_segment}`}>
						<ArrowRightIcon className='size-6 text-muted-foreground' />
					</Link>
				</Button>
				{t('common.sections.edit_coupon') + ' : '}
				<span className='capitalize font-semibold'>{(result.data as TCouponFormValues)?.[`name_${locale}`]}</span>
			</div>

			<Suspense fallback={<LoaderBlock />}>
				<CouponForm type={EnumFormTypes.UPDATE} response={result} />
			</Suspense>
		</div>
	);
}

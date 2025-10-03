// import { prisma_DB } from '@/lib/prisma';
import { mapTranslations } from '@/lib/server/mapTranslations.server';
import { prisma_DB } from '@/server/db/prisma';
import { NextResponse } from 'next/server';
// import { mapTranslations } from '@/lib/mapTranslations';

export async function GET(req: Request) {
	const headers = Object.fromEntries(req.headers.entries());
	console.log('headers', headers);

	const brands = await prisma_DB.brand.findMany({
		include: {
			translations: true,
			image: true,
		},
	});

	const data = {
		id: brand.id,
		image: brand?.image ? [{ fileId: brand.image.fileId, url: brand.image.url }] : [],
		...(await mapTranslations(brand.translations, {
			accept_language: req.headers.get('accept-language'),
			fields: ['name', 'slug', 'description'],
		})),
	};
	
	

   const result = { success: true, status: 200, data };

	return NextResponse.json(result);
}

import imagekit from '@/lib/utils.server/imagekit.server';
import { NextResponse } from 'next/server';
// import imagekit from '@/lib/imagekit';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const searchQuery = searchParams.get('search') || '';
	const skip = Number(searchParams.get('skip') || 0);
	const limit = Number(searchParams.get('limit') || 40);

	try {
		const files = await imagekit.listFiles({
			searchQuery,
			skip,
			limit,
		});
		return NextResponse.json(files);
	} catch (err) {
		console.error('ImageKit list error:', err);
		return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
	}
}

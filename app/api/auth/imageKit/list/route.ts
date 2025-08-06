import { imageKit } from '../route';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const search = searchParams.get('search') ?? '';
		const limit = Number(searchParams.get('limit') ?? 30);
		const skip = Number(searchParams.get('skip') ?? 0);
		const folder = searchParams.get('folder') ?? undefined;

		// ImageKit uses simple query language for searchQuery
		// e.g. name LIKE "*keyword*" AND folderPath = "/my-folder"
		const searchQueryParts: string[] = [];
		if (search) searchQueryParts.push(`name LIKE \"*${search}*\"`);
		if (folder) searchQueryParts.push(`folderPath = \"${folder}\"`);
		const searchQuery = searchQueryParts.length ? searchQueryParts.join(' AND ') : undefined;

		const files = await imageKit.listFiles({
			searchQuery,
			limit,
			skip,
			sort: 'DESC_CREATED', // newest first
		});

		return NextResponse.json(files);
	} catch (e: any) {
		console.error(e);
		return NextResponse.json({ error: e?.message || 'Failed to list files' }, { status: 500 });
	}
}

import { NextResponse } from 'next/server';
import { imageKit } from '../route';

export async function POST(req: Request) {
	try {
		const { fileId, newFileName } = await req.json();
		if (!fileId || !newFileName) return NextResponse.json({ error: 'fileId & newFileName are required' }, { status: 400 });

		const result = await imageKit.renameFile(fileId, newFileName);
		return NextResponse.json(result);
	} catch (e: any) {
		console.error(e);
		return NextResponse.json({ error: e?.message || 'Failed to rename file' }, { status: 500 });
	}
}

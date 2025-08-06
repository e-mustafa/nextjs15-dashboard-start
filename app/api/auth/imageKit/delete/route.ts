import { NextResponse } from 'next/server';
import { imageKit } from '../route';

export async function DELETE(req: Request) {
	try {
		const { fileId } = await req.json();
		if (!fileId) return NextResponse.json({ error: 'fileId is required' }, { status: 400 });

		await imageKit.deleteFile(fileId);
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		console.error(e);
		return NextResponse.json({ error: e?.message || 'Failed to delete file' }, { status: 500 });
	}
}
// 
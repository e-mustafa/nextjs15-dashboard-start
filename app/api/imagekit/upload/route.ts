import imagekit from '@/lib/imagekit.server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	try {
		const form = await req.formData();
		const file = form.get('file') as File | null;
		const fileName = (form.get('fileName') as string) || 'unnamed';
		const folder = (form.get('folder') as string) || undefined;

		if (!file) {
			return NextResponse.json({ error: 'Missing file' }, { status: 400 });
		}

		// Convert to base64 because imagekit-node SDK expects a base64 or URL/buffer
		const arrayBuffer = await file.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString('base64');

		const uploaded = await imagekit.upload({
			file: base64,
			fileName,
			folder,
		});

		return NextResponse.json(uploaded);
	} catch (e: any) {
		console.error(e);
		return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
	}
}

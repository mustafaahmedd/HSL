import { NextRequest, NextResponse } from 'next/server';
import { driveDownloadUrl } from '@/lib/playerImport';

// GET /api/drive-photo?id=<driveFileId>
// Streams a publicly shared Google Drive image through our server. Used for the import preview and as a
// fallback photoUrl when copying to Cloudinary fails. Hotlinking Drive directly gets rate-limited (429).
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '';
  if (!/^[\w-]{10,}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const res = await fetch(driveDownloadUrl(id));
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !type.startsWith('image/')) {
    return NextResponse.json({ error: 'Image not available' }, { status: 404 });
  }

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}

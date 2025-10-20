import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  try {
    const upstream = await fetch(url, {
      headers: {
        // Some hosts require a User-Agent/Referer; keep it minimal
        'User-Agent': 'DynastyLeagueApp/1.0',
      },
    });
    if (!upstream.ok) {
      return new NextResponse('Failed to fetch image', { status: upstream.status });
    }
    const contentType = upstream.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return new NextResponse('Error fetching image', { status: 500 });
  }
}




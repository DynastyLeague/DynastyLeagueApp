import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function GET() {
  clearAuthCookies();
  return NextResponse.json({ ok: true });
}

export async function POST() {
  clearAuthCookies();
  return NextResponse.json({ ok: true });
}



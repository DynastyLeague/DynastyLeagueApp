import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/server/auth';

const PROTECTED_PREFIXES = ['/weekly-selection', '/my-team'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!protectedRoute) return NextResponse.next();

  const access = req.cookies.get('dl_access')?.value;
  const payload = await verifySession(access);
  if (payload) return NextResponse.next();

  // No valid access; redirect to login page
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/weekly-selection/:path*', '/my-team/:path*'],
};



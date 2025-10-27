import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/server/auth';

const PROTECTED_PREFIXES = ['/weekly-selection', '/roster', '/matchups', '/league'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!protectedRoute) return NextResponse.next();

  const access = req.cookies.get('dl_access')?.value;
  
  if (!access) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  const payload = await verifySession(access);
  
  if (!payload) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/weekly-selection/:path*', '/roster/:path*', '/matchups/:path*', '/league/:path*'],
};



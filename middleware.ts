import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/server/auth';

// No protected routes - app is fully accessible
export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};



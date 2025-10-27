import { NextResponse } from 'next/server';
import { readAccess, readRefresh, signSession, setAccessCookie } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function GET() {
  const access = await readAccess();
  if (access) return NextResponse.json({ teamId: access.teamId, teamName: access.teamName, role: access.role });

  const refresh = await readRefresh();
  if (refresh) {
    // auto-refresh access
    const newAccess = await signSession({ teamId: refresh.teamId, teamName: refresh.teamName, role: refresh.role }, 60 * 60);
    await setAccessCookie(newAccess, 60 * 60);
    return NextResponse.json({ teamId: refresh.teamId, teamName: refresh.teamName, role: refresh.role });
  }
  return NextResponse.json({ teamId: null }, { status: 401 });
}



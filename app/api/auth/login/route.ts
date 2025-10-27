import { NextRequest, NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/server/google';
import { isCommissioner, signSession, setAccessCookie, setRefreshCookie } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, remember } = await request.json();
    const emailInput = String(email || '').trim();
    const providedPassword = String(password || '').trim();
    if (!emailInput || !providedPassword) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Teams!A:D' });
    const rows = res.data.values || [];
    const data = rows.slice(1); // skip header
    console.log('Login rows:', data.length);

    const emailLower = emailInput.toLowerCase();
    const match = data.find((r) => (String(r[2] || '').trim().toLowerCase()) === emailLower);
    if (!match) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const teamId = match[0] || '';
    const teamName = match[1] || '';
    const teamPassword = (match[3] || '').toString().trim();
    console.log('Login match teamId:', teamId, 'teamName:', teamName);

    // Plain-text compare for now (recommend hashes later)
    if (providedPassword !== teamPassword) {
      console.warn('Password mismatch for', teamId);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

        const role = isCommissioner(teamId) ? 'commissioner' as const : 'team' as const;
        const access = await signSession({ teamId, teamName, role }, 60 * 60); // 60 min
        const refreshTtl = remember ? 60 * 60 * 24 * 60 : 60 * 60 * 24 * 7; // 60d vs 7d
        const refresh = await signSession({ teamId, teamName, role }, refreshTtl);

        await setAccessCookie(access, 60 * 60);
        await setRefreshCookie(refresh, refreshTtl);

    return NextResponse.json({ teamId, teamName, role });
  } catch (e) {
    console.error('Login error', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

// cleaned duplicate implementation

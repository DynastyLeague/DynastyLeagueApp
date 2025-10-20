import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/server/google';

export const runtime = 'nodejs';

export async function GET() {
  const result: Record<string, unknown> = {
    env: {
      hasSheetsId: Boolean(process.env.GOOGLE_SHEETS_ID),
      hasClientEmail: Boolean(process.env.GOOGLE_CLIENT_EMAIL),
      hasPrivateKey: Boolean(process.env.GOOGLE_PRIVATE_KEY) || Boolean(process.env.GOOGLE_PRIVATE_KEY_BASE64),
      usingBase64: Boolean(process.env.GOOGLE_PRIVATE_KEY_BASE64),
    },
  };

  try {
    const sheets = await getSheetsClient();
    result.googleAuth = 'ok';

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;
    // Try a tiny read to confirm access (Teams header row)
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Teams!A1:F1',
    });
    result.sheetsAccess = 'ok';
    result.sampleHeaders = resp.data.values?.[0] || [];
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; reason?: string };
    result.error = {
      message: String(err?.message || error),
      code: err?.code,
      reason: err?.reason,
    };
    return NextResponse.json(result, { status: 500 });
  }
}




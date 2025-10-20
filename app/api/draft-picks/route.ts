import { getSheetsClient } from '@/lib/server/google';
import { NextRequest, NextResponse } from 'next/server';

// Ensure Node.js runtime (not Edge) for googleapis compatibility
export const runtime = 'nodejs';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const DRAFT_PICKS_SHEET_NAME = 'Draft Picks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${DRAFT_PICKS_SHEET_NAME}!A:H`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    // Find the team's draft picks row
    const teamRow = rows.find(row => row[0] === teamId);
    if (!teamRow) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Map the draft picks data
    const draftPicks = {
      teamId: teamRow[0] || '',
      picks2026: teamRow[1] || '',
      picks2027: teamRow[2] || '',
      picks2028: teamRow[3] || '',
      picks2029: teamRow[4] || '',
      picks2030: teamRow[5] || '',
      picks2031: teamRow[6] || '',
      notes: teamRow[7] || '',
    };

    return NextResponse.json(draftPicks);
  } catch (error) {
    console.error('Error fetching draft picks:', error);
    return NextResponse.json({ error: 'Failed to fetch draft picks' }, { status: 500 });
  }
}








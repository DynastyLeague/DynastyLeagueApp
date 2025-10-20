import { getSheetsClient } from '@/lib/server/google';
import { NextResponse } from 'next/server';

// Ensure Node.js runtime (not Edge) for googleapis compatibility
export const runtime = 'nodejs';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const TEAMS_SHEET_NAME = 'Teams';

// Initialize Google Sheets API
// use centralized sheets client

// API route to get teams
export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TEAMS_SHEET_NAME}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    // Skip header row and map data
    const teams = rows.slice(1).map((row, index) => {
      const mainLogo = String(row[4] || '').trim();
      const wordLogo = String(row[5] || '').trim();
      
      return {
        teamId: row[0] || `team_${index}`,
        teamName: row[1] || '',
        email: row[2] || '',
        password: row[3] || '',
        mainLogo,
        wordLogo,
        established: row[6] || '',
        conference: row[7] || '',
        manager: row[8] || '',
        record: row[9] || '',
        playoffs: row[10] || '',
        conferenceTitles: row[11] || '',
        championships: row[12] || '',
      };
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

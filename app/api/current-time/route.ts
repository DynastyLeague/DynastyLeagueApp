import { getSheetsClient } from '@/lib/server/google';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'TodaysDate!A2:B2', // Row 2: Todays Date, Current Time
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    const row = rows[0];
    const todaysDate = row[0] || ''; // Column A: Todays Date
    const currentTime = row[1] || ''; // Column B: Current Time

    return NextResponse.json({
      date: todaysDate,
      time: currentTime,
    });
  } catch (error) {
    console.error('Error fetching current time:', error);
    return NextResponse.json({ error: 'Failed to fetch current time' }, { status: 500 });
  }
}


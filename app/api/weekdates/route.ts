import { getSheetsClient } from '@/lib/server/google';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
      range: 'WeekDates!A:C',
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    const weekDates = rows.slice(1).map((row) => ({
      week: parseInt(row[0]) || 0,
      startDate: row[1] || '',
      finishDate: row[2] || '',
    }));

    return NextResponse.json(weekDates);
  } catch (error) {
    console.error('Error fetching week dates:', error);
    return NextResponse.json({ error: 'Failed to fetch week dates' }, { status: 500 });
  }
}

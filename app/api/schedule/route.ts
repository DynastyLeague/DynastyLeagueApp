import { getSheetsClient } from '@/lib/server/google';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
      range: 'Schedule!A:E',
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    let games = rows.slice(1).map((row) => ({
      week: parseInt(row[0]) || 0,
      nbaTeam: row[1] || '',
      date: row[2] || '',
      opponent: row[3] || '',
      homeAway: row[4] || '',
    }));

    // Filter by week if provided
    if (week) {
      const weekNum = parseInt(week);
      games = games.filter(game => game.week === weekNum);
    }

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

import { getSheetsClient } from '@/lib/server/google';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export type Standing = {
  teamId: string;
  teamName: string;
  conference: string;
  position: number;
  wins: number;
  losses: number;
  ties: number;
  record: string;
  pointsFor: number;
  pointsAgainst: number;
  percentage: number;
};

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Standings!A:K',
    });

    const rows = response.data.values || [];
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    // Skip header row
    const dataRows = rows.slice(1);

    const standings: Standing[] = dataRows
      .map((row) => {
        return {
          teamId: row[0] || '',
          teamName: row[1] || '',
          conference: row[2] || '',
          position: parseInt(row[3]) || 0,
          wins: parseInt(row[4]) || 0,
          losses: parseInt(row[5]) || 0,
          ties: parseInt(row[6]) || 0,
          record: row[7] || '',
          pointsFor: parseFloat(row[8]) || 0,
          pointsAgainst: parseFloat(row[9]) || 0,
          percentage: parseFloat(row[10]) || 0,
        };
      })
      .filter(standing => standing.teamId && standing.position > 0 && standing.position <= 7);

    return NextResponse.json(standings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}


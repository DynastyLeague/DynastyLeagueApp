import { getSheetsClient } from '@/lib/server/google';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
      range: 'Matchups!A:AJ',
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    const matchups = rows.slice(1).map((row, index) => ({
      week: parseInt(row[0]) || 0,
      matchupId: row[1] || `matchup_${index}`,
      team1Id: row[2] || '',
      team1Name: row[3] || '',
      team2Id: row[4] || '',
      team2Name: row[5] || '',
      team1Score: parseFloat(row[6]) || 0,
      team1Gp: parseInt(row[7]) || 0,
      team1Pts: parseInt(row[8]) || 0,
      team13pm: parseInt(row[9]) || 0,
      team1Ast: parseInt(row[10]) || 0,
      team1Stl: parseInt(row[11]) || 0,
      team1Blk: parseInt(row[12]) || 0,
      team1Orb: parseInt(row[13]) || 0,
      team1Drb: parseInt(row[14]) || 0,
      team1Fgm: parseInt(row[15]) || 0,
      team1Fga: parseInt(row[16]) || 0,
      team1FgPercent: parseFloat(row[17]) || 0,
      team1Ftm: parseInt(row[18]) || 0,
      team1Fta: parseInt(row[19]) || 0,
      team1FtPercent: parseFloat(row[20]) || 0,
      team2Score: parseFloat(row[21]) || 0,
      team2Gp: parseInt(row[22]) || 0,
      team2Pts: parseInt(row[23]) || 0,
      team23pm: parseInt(row[24]) || 0,
      team2Ast: parseInt(row[25]) || 0,
      team2Stl: parseInt(row[26]) || 0,
      team2Blk: parseInt(row[27]) || 0,
      team2Orb: parseInt(row[28]) || 0,
      team2Drb: parseInt(row[29]) || 0,
      team2Fgm: parseInt(row[30]) || 0,
      team2Fga: parseInt(row[31]) || 0,
      team2FgPercent: parseFloat(row[32]) || 0,
      team2Ftm: parseInt(row[33]) || 0,
      team2Fta: parseInt(row[34]) || 0,
      team2FtPercent: parseFloat(row[35]) || 0,
    }));

    return NextResponse.json(matchups);
  } catch (error) {
    console.error('Error fetching matchups:', error);
    return NextResponse.json({ error: 'Failed to fetch matchups' }, { status: 500 });
  }
}

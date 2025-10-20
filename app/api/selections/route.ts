import { getSheetsClient } from '@/lib/server/google';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const teamId = searchParams.get('teamId');
    const matchupId = searchParams.get('matchupId');

    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

    // Fetch all player game stats data from the new PlayerGameStats tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      // Need all columns up to FT% (28 columns: A through AB)
      range: 'PlayerGameStats!A:AB',
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1);

    // Filter selections based on parameters
    let filteredRows = dataRows;
    
    if (week) {
      filteredRows = filteredRows.filter(row => row[0] === week);
    }
    
    if (teamId) {
      filteredRows = filteredRows.filter(row => row[2] === teamId);
    }

    if (matchupId) {
      filteredRows = filteredRows.filter(row => row[1] === matchupId);
    }

    // Map to selection objects (schema aligns with PlayerGameStats headers)
    const baseSelections = filteredRows.map(row => ({
      week: parseInt(row[0]) || 0,
      matchupId: row[1] || '',
      teamId: row[2] || '',
      teamName: row[3] || '',
      opponentTeamName: row[4] || '',
      position: row[5] || '',
      playerId: row[6] || '',
      playerName: row[7] || '',
      nbaTeam: row[8] || '',
      gameDate: row[9] || '',
      nbaOpposition: row[10] || '',
      submittedDateTime: row[11] || '',
      dateCode: row[12] || '',
      time: row[13] || '',
      min: parseInt(row[14]) || 0,
      pts: parseInt(row[15]) || 0,
      threePm: parseInt(row[16]) || 0,
      ast: parseInt(row[17]) || 0,
      stl: parseInt(row[18]) || 0,
      blk: parseInt(row[19]) || 0,
      orb: parseInt(row[20]) || 0,
      drb: parseInt(row[21]) || 0,
      fgm: parseInt(row[22]) || 0,
      fga: parseInt(row[23]) || 0,
      fgPercent: parseFloat(row[24]) || 0,
      ftm: parseInt(row[25]) || 0,
      fta: parseInt(row[26]) || 0,
      ftPercent: parseFloat(row[27]) || 0,
    }));

    // Enrich with photoUrl by looking up Players sheet by player name (column B) → photo in column BB
    let selections = baseSelections;
    if (baseSelections.length > 0) {
      try {
        const playersResp = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Players!A:BB',
        });
        const playerRows = playersResp.data.values || [];
        const playerDataRows = playerRows.slice(1);
        const nameToPhoto = new Map<string, string>();
        for (const prow of playerDataRows) {
          const name = (prow[1] || '').toString().trim(); // column B
          const photoUrl = (prow[53] || '').toString().trim(); // column BB
          if (name) {
            nameToPhoto.set(name.toLowerCase(), photoUrl);
          }
        }
        selections = baseSelections.map(sel => ({
          ...sel,
          photoUrl: nameToPhoto.get((sel.playerName || '').toLowerCase()) || '',
        }));
      } catch (e) {
        console.warn('Photo enrichment failed, falling back to base selections:', e);
        selections = baseSelections;
      }
    }

    return NextResponse.json(selections);
  } catch (error) {
    console.error('Error fetching selections:', error);
    return NextResponse.json({ error: 'Failed to fetch selections' }, { status: 500 });
  }
}

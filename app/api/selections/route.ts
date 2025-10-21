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

    // Fetch all selections data from Selections tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      // Columns: week, matchup_id, team_id, team_name, opp_team_name, positions, player_id, player_name, nba_team, game_date, selected_game, submitted_date_time
      range: 'Selections!A:L',
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

    // Map to selection objects (schema aligns with Selections tab headers)
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
      selectedGame: row[10] || '',
      submittedDateTime: row[11] || '',
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

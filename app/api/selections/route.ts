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

    // Fetch all selections data from PlayerGameStats tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      // Headers: week matchup_id team_id team_name opp_team_name positions player_id player_name nba_team game_date nba_opposition submitted_date_time date_code TIME MIN PTS 3PM AST STL BLK ORB DRB FGM FGA FG% FTM FTA FT%
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

    // Map to selection objects (schema aligns with PlayerGameStats tab headers)
    const baseSelections = filteredRows.map(row => ({
      week: parseInt(row[0]) || 0,          // A: week
      matchupId: row[1] || '',               // B: matchup_id
      teamId: row[2] || '',                  // C: team_id
      teamName: row[3] || '',                // D: team_name
      opponentTeamName: row[4] || '',        // E: opp_team_name
      position: row[5] || '',                // F: positions
      playerId: row[6] || '',                // G: player_id
      playerName: row[7] || '',              // H: player_name
      nbaTeam: row[8] || '',                 // I: nba_team
      gameDate: row[9] || '',                // J: game_date
      nbaOpposition: row[10] || '',          // K: nba_opposition
      submittedDateTime: row[11] || '',      // L: submitted_date_time
      dateCode: row[12] || '',               // M: date_code
      time: row[13] || '',                   // N: TIME
      min: parseFloat(row[14]) || 0,         // O: MIN
      pts: parseFloat(row[15]) || 0,         // P: PTS
      threePm: parseFloat(row[16]) || 0,     // Q: 3PM
      ast: parseFloat(row[17]) || 0,         // R: AST
      stl: parseFloat(row[18]) || 0,         // S: STL
      blk: parseFloat(row[19]) || 0,         // T: BLK
      orb: parseFloat(row[20]) || 0,         // U: ORB
      drb: parseFloat(row[21]) || 0,         // V: DRB
      fgm: parseFloat(row[22]) || 0,         // W: FGM
      fga: parseFloat(row[23]) || 0,         // X: FGA
      fgPercent: parseFloat(row[24]) || 0,   // Y: FG%
      ftm: parseFloat(row[25]) || 0,         // Z: FTM
      fta: parseFloat(row[26]) || 0,         // AA: FTA
      ftPercent: parseFloat(row[27]) || 0,   // AB: FT%
      selectedGame: row[10] || '',           // Kept for backwards compatibility, same as nbaOpposition
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

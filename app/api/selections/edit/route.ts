import { getSheetsClient } from '@/lib/server/google';
import { NextRequest, NextResponse } from 'next/server';
import { readAccess } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await readAccess();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is commissioner
    if (session.teamId !== 'T014') {
      return NextResponse.json({ error: 'Forbidden: Commissioner access required' }, { status: 403 });
    }

    const body = await request.json();
    const { week, matchupId, teamName, position, changes } = body;

    // Validate required fields
    if (!week || !matchupId || !teamName || !position) {
      return NextResponse.json({ error: 'Missing required fields: week, matchupId, teamName, position' }, { status: 400 });
    }

    if (!changes || (Object.keys(changes).length === 0)) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

    // Get existing selections
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Selections!A:AB',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No selections found' }, { status: 404 });
    }

    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    // Find matching row(s) - match by: week, matchupId, teamName, position
    // Column A = week (index 0)
    // Column B = matchup_id (index 1)
    // Column D = team_name (index 3)
    // Column F = positions (index 5)
    let foundMatch = false;
    const updatedRows = dataRows.map((row: string[]) => {
      const rowWeek = String(row[0] || '').trim();
      const rowMatchupId = String(row[1] || '').trim();
      const rowTeamName = String(row[3] || '').trim();
      const rowPosition = String(row[5] || '').trim();

      // Check if this row matches
      if (
        rowWeek === String(week) &&
        rowMatchupId === String(matchupId) &&
        rowTeamName === String(teamName) &&
        rowPosition === String(position)
      ) {
        foundMatch = true;
        const updatedRow = [...row];

        // Update player fields if provided
        if (changes.playerId !== undefined) {
          updatedRow[6] = changes.playerId; // Column G: player_id
        }
        if (changes.playerName !== undefined) {
          updatedRow[7] = changes.playerName; // Column H: player_name
        }
        if (changes.nbaTeam !== undefined) {
          updatedRow[8] = changes.nbaTeam; // Column I: nba_team
        }

        // Update game fields if provided
        if (changes.gameDate !== undefined) {
          updatedRow[9] = changes.gameDate; // Column J: game_date
        }
        // Column K can be selectedGame or nbaOpposition (same column)
        if (changes.selectedGame !== undefined) {
          updatedRow[10] = changes.selectedGame; // Column K: selected_game
        } else if (changes.nbaOpposition !== undefined) {
          updatedRow[10] = changes.nbaOpposition; // Column K: nba_opposition (fallback if selectedGame not provided)
        }

        // Update submitted_date_time to current timestamp
        updatedRow[11] = new Date().toISOString(); // Column L: submitted_date_time

        return updatedRow;
      }

      return row;
    });

    if (!foundMatch) {
      return NextResponse.json({ 
        error: 'No matching selection found',
        details: { week, matchupId, teamName, position }
      }, { status: 404 });
    }

    // Write back to Selections tab
    const allRows = [headerRow, ...updatedRows];

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Selections!A:AB',
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Selections!A:AB',
      valueInputOption: 'RAW',
      requestBody: {
        values: allRows,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Selection updated successfully',
      updated: { week, matchupId, teamName, position, changes }
    });

  } catch (error) {
    console.error('Error updating selection:', error);
    return NextResponse.json({ error: 'Failed to update selection' }, { status: 500 });
  }
}


import { getSheetsClient } from '@/lib/server/google';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { week, teamId, teamName, selections, opponentTeamName, matchupId } = body;

    console.log('Submission data:', { week, teamId, teamName, selectionsCount: selections?.length });

    if (!week || !teamId || !teamName || !selections) {
      console.error('Missing required fields:', { week, teamId, teamName, hasSelections: !!selections });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

    console.log('Getting existing selections...');

    // First, get existing selections to filter out only this team's selections for this week
    const clearResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Selections!A:AB',
    });

    const rows = clearResponse.data.values || [];
    const headerRow = rows[0] || [];
    const dataRows = rows.slice(1);

    // Filter out ONLY rows for this specific team and week (keep all other data)
    // Column A (index 0) = week, Column C (index 2) = team_id
    const filteredRows = dataRows.filter(row => 
      !(row[0] === week.toString() && row[2] === teamId)
    );

    // Prepare new selection data (matching your exact headers)
    const newRows = selections.map((selection: unknown) => {
      const sel = selection as {
        position: string;
        playerId: string;
        playerName: string;
        nbaTeam: string;
        gameDate: string;
        selectedGame?: string;
      };
      return [
        week,                    // A: week
        matchupId || '',         // B: matchup_id column
        teamId,                  // C: team_id
        teamName,                // D: team_name
        opponentTeamName || '',  // E: opp_team_name column
        sel.position,            // F: positions column
        sel.playerId,            // G: player_id
        sel.playerName,          // H: player_name
        sel.nbaTeam,             // I: nba_team
        sel.gameDate,            // J: game_date
        sel.selectedGame || '',  // K: selected_game (formatted game title)
        new Date().toISOString() // L: submitted_date_time
      ];
    });

    // Combine filtered existing rows with new selections
    const allRows = [headerRow, ...filteredRows, ...newRows];

    // Clear and update the entire Selections tab
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Selections!A:AB',
    });

    console.log('Updating selections with', allRows.length, 'rows...');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Selections!A:AB',
      valueInputOption: 'RAW',
      requestBody: {
        values: allRows,
      },
    });

    console.log('Submission successful');
    return NextResponse.json({ success: true, message: 'Selections submitted successfully' });

  } catch (error) {
    console.error('Error submitting selections:', error);
    return NextResponse.json({ error: 'Failed to submit selections' }, { status: 500 });
  }
}

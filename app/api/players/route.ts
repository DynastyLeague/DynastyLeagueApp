import { getSheetsClient } from '@/lib/server/google';
import { NextRequest, NextResponse } from 'next/server';

// Ensure Node.js runtime (not Edge) for googleapis compatibility
export const runtime = 'nodejs';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const PLAYERS_SHEET_NAME = 'Players';

// Initialize Google Sheets API
// use centralized sheets client

// API route to get players
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIdParam = searchParams.get('teamId');
    const statusParam = searchParams.get('status');

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PLAYERS_SHEET_NAME}!A:AY`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    // Skip header row and map data (matching your exact headers)
    let players = rows.slice(1).map((row, index) => ({
      playerId: row[0] || `player_${index}`, // player_id
      name: row[1] || '', // player_name
      teamId: row[2] || '', // team_id
      dynastyTeam: row[3] || '', // Dynasty Team
      rosterStatus: (() => {
        const raw = String(row[4] || 'ACTIVE').toUpperCase().trim(); // Roster Status
        if (raw === 'DEV' || raw === 'DEVELOPMENTAL' || raw === 'DEVELOPMENT') return 'DEVELOPMENT' as const;
        if (raw === 'IR' || raw === 'INJ' || raw === 'INJURY') return 'INJURY' as const;
        return 'ACTIVE' as const;
      })(),
      nbaTeam: row[5] || '', // NBA Team
      position: row[6] || '', // postion (note: typo in your header)
      birthDate: row[7] || '', // Birth Date
      age: parseInt(row[8]) || 0, // age
      drafted: row[9] || '', // Drafted
      signedVia: row[10] || '', // Signed Via
      year: row[11] || '', // Year
      contractLength: row[12] || '', // Contract Length
      contractNotes: row[13] || '', // Contract Notes
      extension: row[14] || '', // Extension
      awards: row[15] || '', // Awards
      playerHistoryLog: row[16] || '', // Player History Log
      rankType: row[17] || '', // RANK TYPE
      twoYearRank: row[18] || '', // RANK
      careerRank: row[19] || '', // CAREER RANK (new column)
      rank21_22: row[20] || '', // rank 21-22
      rank22_23: row[21] || '', // rank 22-23
      rank23_24: row[22] || '', // rank 23-24
      rank24_25: row[23] || '', // rank 24-25
      rank25_26: row[24] || '', // rank 25-26
      rank26_27: row[25] || '', // rank 26-27
      rank27_28: row[26] || '', // rank 27-28
      careerEarnings: row[28] || '', // Career Earnings (row 28, shifted +1)
      salary21_22: parseFloat(row[29]) || 0, // Salary 21-22 (shifted +1)
      salary22_23: parseFloat(row[30]) || 0, // Salary 22-23 (shifted +1)
      salary23_24: parseFloat(row[31]) || 0, // Salary 23-24 (shifted +1)
      salary24_25: parseFloat(row[32]) || 0, // Salary 24-25 (shifted +1)
      salary25_26: (() => {
        const rawValue = row[33];
        if (!rawValue || rawValue === '') return '';
        
        // Handle contract status values (EXT/UFA, RFA, UFA, etc.)
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        
        // Parse as number and format with $ and m
        const val = parseFloat(rawValue);
        return isNaN(val) ? '' : val;
      })(), // Salary 25-26 (AH)
      option25_26: row[34] || '', // Option 25-26 (AI)
      salary26_27: (() => {
        const rawValue = row[35];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // Salary 26-27 (AJ)
      option26_27: row[36] || '', // Option 26-27 (AK)
      salary27_28: (() => {
        const rawValue = row[37];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // Salary 27-28 (AL)
      option27_28: row[38] || '', // Option 27-28 (AM)
      salary28_29: (() => {
        const rawValue = row[39];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // Salary 28-29 (AN)
      option28_29: row[40] || '', // Option 28-29 (AO)
      salary29_30: (() => {
        const rawValue = row[41];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // Salary 29-30 (AP)
      option29_30: row[42] || '', // Option 29-30 (AQ)
      salary30_31: (() => {
        const rawValue = row[43];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // Salary 30-31 (AR)
      option30_31: row[44] || '', // Option 30-31 (AS)
      salary31_32: (() => {
        const rawValue = row[45];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // Salary 31-32 (AT)
      option31_32: row[46] || '', // Option 31-32 (AU)
      salary32_33: parseFloat(row[47]) || 0, // Salary 32-33 (shifted +1)
      option32_33: row[48] || '', // Option 32-33 (shifted +1)
      salary33_34: parseFloat(row[49]) || 0, // Salary 33-34 (shifted +1)
      option33_34: row[50] || '', // Option 33-34 (shifted +1)
      salary34_35: parseFloat(row[51]) || 0, // Salary 34-35 (shifted +1)
      option34_35: row[52] || '', // Option 34-35 (shifted +1)
    }));

    // Filter by team if teamCode provided
    if (teamIdParam) {
      players = players.filter(player => player.teamId === teamIdParam);
    }

    // Filter by status if status provided (normalize input)
    if (statusParam) {
      const normalized = (() => {
        const raw = statusParam.toUpperCase().trim();
        if (raw === 'DEV' || raw === 'DEVELOPMENTAL') return 'DEVELOPMENT' as const;
        if (raw === 'IR' || raw === 'INJ') return 'INJURY' as const;
        if (raw === 'ACTIVE' || raw === 'DEVELOPMENT' || raw === 'INJURY') return raw as 'ACTIVE' | 'DEVELOPMENT' | 'INJURY';
        return undefined;
      })();
      if (normalized) {
        players = players.filter(player => player.rosterStatus === normalized);
      }
    }

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

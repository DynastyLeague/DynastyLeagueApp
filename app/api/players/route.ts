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
      range: `${PLAYERS_SHEET_NAME}!A:BB`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return NextResponse.json([]);
    }

    // Skip header row and map data (matching your exact headers)
    let players = rows.slice(1).map((row, index) => ({
      playerId: row[0] || `player_${index}`, // A: player_id
      name: row[1] || '', // B: player_name
      teamId: row[2] || '', // C: team_id
      dynastyTeam: row[3] || '', // D: Dynasty Team
      rosterStatus: (() => {
        const raw = String(row[4] || 'ACTIVE').toUpperCase().trim(); // E: Roster Status
        if (raw === 'DEV' || raw === 'DEVELOPMENTAL' || raw === 'DEVELOPMENT') return 'DEVELOPMENT' as const;
        if (raw === 'IR' || raw === 'INJ' || raw === 'INJURY') return 'INJURY' as const;
        return 'ACTIVE' as const;
      })(),
      nbaTeam: row[5] || '', // F: NBA Team
      position: row[6] || '', // G: postion (note: typo in your header)
      birthDate: row[7] || '', // H: Birth Date
      age: parseInt(row[8]) || 0, // I: age
      drafted: row[9] || '', // J: Drafted
      signedVia: row[10] || '', // K: Signed Via
      year: row[11] || '', // L: Year
      contractLength: row[12] || '', // M: Contract Length
      contractNotes: row[13] || '', // N: Contract Notes
      extension: row[14] || '', // O: Extension
      awards: row[15] || '', // P: Awards
      playerHistoryLog: row[16] || '', // Q: Player History Log
      rankType: row[17] || '', // R: RANK TYPE
      twoYearRank: row[18] || '', // S: RANK
      careerRank: row[19] || '', // T: CAREER RANK
      rank21_22: row[20] || '', // U: rank 21-22
      rank22_23: row[21] || '', // V: rank 22-23
      rank23_24: row[22] || '', // W: rank 23-24
      rank24_25: row[23] || '', // X: rank 24-25
      rank25_26: row[24] || '', // Y: rank 25-26
      rank26_27: row[25] || '', // Z: rank 26-27
      rank27_28: row[26] || '', // AA: rank 27-28
      rank28_29: row[27] || '', // AB: rank 28-29
      careerEarnings: row[28] || '', // AC: Career Earnings
      salary21_22: parseFloat(row[29]) || 0, // AD: Salary 21-22
      salary22_23: parseFloat(row[30]) || 0, // AE: Salary 22-23
      salary23_24: parseFloat(row[31]) || 0, // AF: Salary 23-24
      salary24_25: parseFloat(row[32]) || 0, // AG: Salary 24-25
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
      })(), // AH: Salary 25-26
      option25_26: row[34] || '', // AI: Option 25-26
      salary26_27: (() => {
        const rawValue = row[35];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AJ: Salary 26-27
      option26_27: row[36] || '', // AK: Option 26-27 (header says "Option 25-26" but should be 26-27)
      salary27_28: (() => {
        const rawValue = row[37];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AL: Salary 27-28
      option27_28: row[38] || '', // AM: Option 27-28
      salary28_29: (() => {
        const rawValue = row[39];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AN: Salary 28-29
      option28_29: row[40] || '', // AO: Option 28-29 (header says "Option 25-26" but should be 28-29)
      salary29_30: (() => {
        const rawValue = row[41];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AP: Salary 29-30
      option29_30: row[42] || '', // AQ: Option 29-30
      salary30_31: (() => {
        const rawValue = row[43];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AR: Salary 30-31
      option30_31: row[44] || '', // AS: Option 30-31
      salary31_32: (() => {
        const rawValue = row[45];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AT: Salary 31-32
      option31_32: row[46] || '', // AU: Option 31-32
      salary32_33: (() => {
        const rawValue = row[47];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AV: Salary 32-33
      option32_33: row[48] || '', // AW: Option 32-33
      salary33_34: (() => {
        const rawValue = row[49];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AX: Salary 33-34
      option33_34: row[50] || '', // AY: Option 33-34
      salary34_35: (() => {
        const rawValue = row[51];
        if (!rawValue || rawValue === '') return '';
        if (typeof rawValue === 'string' && (rawValue.includes('EXT/UFA') || rawValue.includes('RFA') || rawValue.includes('UFA') || rawValue.includes('TO'))) {
          return rawValue;
        }
        const cleanValue = rawValue.toString().replace(/[$m]/g, '');
        const val = parseFloat(cleanValue);
        return isNaN(val) ? '' : val;
      })(), // AZ: Salary 34-35
      option34_35: row[52] || '', // BA: Option 34-35
      photo: row[53] || '', // BB: Photo
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

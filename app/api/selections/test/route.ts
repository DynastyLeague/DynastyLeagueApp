import { getSheetsClient } from '@/lib/server/google';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

    console.log('Testing Selections tab access...');
    
    // Try to read just the headers first
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Selections!A1:J1',
    });

    const headers = response.data.values?.[0] || [];
    console.log('Headers found:', headers);

    return NextResponse.json({ 
      success: true, 
      headers,
      message: 'Selections tab is accessible' 
    });

  } catch (error) {
    console.error('Error accessing Selections tab:', error);
    return NextResponse.json({ 
      error: 'Failed to access Selections tab',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}








import { google } from 'googleapis';

function getPrivateKeyFromEnv(): string | undefined {
  const base64 = process.env.GOOGLE_PRIVATE_KEY_BASE64;
  if (base64 && base64.trim().length > 0) {
    try {
      let decoded = Buffer.from(base64.trim(), 'base64').toString('utf8');
      // Remove accidental wrapping quotes
      if ((decoded.startsWith('"') && decoded.endsWith('"')) || (decoded.startsWith("'") && decoded.endsWith("'"))) {
        decoded = decoded.substring(1, decoded.length - 1);
      }
      // Normalize CRLF to LF and collapse stray \r
      decoded = decoded.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      return decoded;
    } catch {
      // fall through to plain key
    }
  }
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) return undefined;
  // Convert escaped newlines to real newlines
  let normalized = key.replace(/\\n/g, '\n');
  // Also normalize CRLF just in case
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Strip accidental wrapping quotes
  if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.substring(1, normalized.length - 1);
  }
  return normalized;
}

export async function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getPrivateKeyFromEnv();
  if (!clientEmail || !privateKey) {
    throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY(_BASE64)');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
  });

  return google.sheets({ version: 'v4', auth });
}



import { google } from 'googleapis';

const SHEET_ID = '1kg7dP0uSRtneoVvnYe5Nur4Izcoto_eU';

const getAuth = () => new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: 'mothers-pl',
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: '108180060006894068264',
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sheetName = req.query.sheet;
  if (!sheetName) return res.status(400).json({ error: 'Sheet name required' });

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    if (req.method === 'GET') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A1:E200`,
      });
      return res.status(200).json({ values: response.data.values || [] });
    }

    if (req.method === 'POST') {
      const { values } = req.body;

      // Try to add sheet tab (ignore error if already exists)
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
        });
      } catch (e) { /* already exists */ }

      // Clear and write
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A:E`,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Sheets API error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

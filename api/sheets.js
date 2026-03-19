import { google } from 'googleapis';

const SHEET_ID = '1kg7dP0uSRtneoVvnYe5Nur4Izcoto_eU';

const CREDENTIALS = {
  type: 'service_account',
  project_id: 'mothers-pl',
  private_key_id: '1f7a3d502990fb2bac0bfb7ae4e89bf5dc3dbc49',
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKXBeQ/mT3ha65
UN9W+j5OWE0dctm4fpxu7JzZRfcexXHdxb6ivTIJIUuU+xwZIrfZ1y27w+rb3X41
soY6PsD4NRI2MhRGkaob5mjV6igcTnFseNFVhPDd0EupzKLr8PFYaa5kEcdMuS6n
IIaWzmKGiVlE2lZQR0+oQFREAStgWGEM3LC9nUoEG4XsjrbrSzRgisSJnluqER4B
X155TB5k4qbiPqFTw49RAYDv98RA/+ethHnPLRSC3QBuxuxpARDKylaBgEjFTFon
5cmQLmb/+GDMjMOw2IqLxdw8NhvidxI1SdA4PQGCmiki9aX51eLzyti/lY9teUHV
XoWpl4qvAgMBAAECggEAQVrIya0/kql8KqGx3/dmFAt0rGQhaPKLN0/3wDxWeXuv
ML7iuNB9znEQZgdLpdqOoi5auN+nhGbekh0cOMd3rzIEtbgq0DfPRr99cEj1t16m
RzAl+4a5/Al/xlEu9SCV8cX/6pXLVj4gkR1yGlaBf43wZMpXQgol8eME1AnEppKR
MKuClWs1mJb31+FHPspFL0GNBkDVBJvB8ynTTxBKcdBb36euEOy5Fe8wkRH8hiut
cT0sK2ZSFGiPsI71Ym/VAvn7eGIIn9j9KtIfbaWYXc7GYwZUxMu6SMW6mqRtGC5M
pYfBDYfG/Qd08N5HvxMSGvC3oikdO1NCwcalcZWwEQKBgQD0eKKgcJomr6xY7OZc
rNQ6PRTQ3Nm76rQ8heesrkFIAnT1e6VILj5noUwYWpGfAtzYfueK0DEmB8f7sSo6
XNb/ZUTtxhjaR4Lr+Y4lkDHpXMfOxGPxDM7o2xllU1Us/YulsXc5DnhF+KOQY1FI
tyYFASoE7WTHqIwcTquw7S4W7QKBgQDT5xF1SCDhDWgI2VPYGjXPbNfw62vVEYam
U8ZgxVzSiXw16XiM4Y/GMZqsPTiBHQr+xTX9PKNIUApySE7m6M7zrom1oHZw9cv7
c47KS4rrd1Hmy440WosOzdJ5X18ojiJZSUEhaonfZw1V3CvRxB3LigvJmjTaAMQM
FxglpdpliwKBgQDyxiHp5iiPJoGmxYt2mQMg2qujRs7K+KcIO4n4SAv4MMhpR+K5
LYM3ckyZGsfl+vfJ3yydA2brd2q3nhZrYur3MWAkKEdh7QYsxOTOlMWcE1ExGoKN
TMTlJT+xCfJZ/WgCoZveA2qZQfNcXeTIq2iMK73Iqt8cD1skeVOzHbZZeQKBgGne
bUuCUOL/1rVtF0XFupK6l5zHkiVuzy40ds2MbZbGl+c7kT4Zx8JGsDdTkvJ29zJY
h2PRMucDDmUQmVMmh5cZ4bV7yREgzNwBXRrW6T5BbAr6Mj8X6Zfo3zpCmwFhGeov
/jlayC10iCYYjVANQrGZc9Aymis87LX5p9fPaDqHAoGBAIlYLbx3zLHV1EG73TEO
Z+VPezhpuyIpNPlHLdcTaMNDGrjDCGp/LzCML+KzJbnJgsscV8mp5WCJ4oN/VNA1
QKsZW7wkFwiKbuv0LE7bqDXIf7rg0Lm4QnaJ87uSKraaqtsBWnOfjBViT+pqm+GH
Fv10xKRCB7Xw/XsmuAvEHshP
-----END PRIVATE KEY-----`,
  client_email: 'mothers-pl-app@mothers-pl.iam.gserviceaccount.com',
  client_id: '108180060006894068264',
};

const getAuth = () => new google.auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

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

      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
        });
      } catch (e) { /* sheet already exists */ }

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

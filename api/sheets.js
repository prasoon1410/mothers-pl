import { google } from 'googleapis';

const SHEET_ID = '1sYm_C3GuJzPAY5_15lP5jDrgmmlsxNblckh5Tmr2Iok';

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

// Exact row mapping in the Excel sheet for each item (column C = input)
const ITEM_ROW_MAP = {
  // Revenue
  card_sale: 7, cash_pos: 8, cash_no_pos: 9, catering: 10,
  zomato: 11, keeta: 12, careem: 13, talabat: 14,
  noon: 15, smiles: 16, deliveroo: 17, ifc_received: 20,
  // Expenses
  chunnilal: 26, alahbaab: 27, kaveri: 28, titli: 29,
  nada: 30, hk: 31, alfarah: 32, coal: 33,
  brothergas: 34, alkhattal: 35, caterpack: 36,
  misc_cash: 39,
  shop_rent: 42, staff_rent: 43, loan_emi: 44,
  wifi: 47, landline: 48, mobile: 49, dewa: 50,
  salary_total: 53,
  visa: 56, airticket: 57,
  pos_rent: 60, it_support: 61,
  accounting: 64, bank_charges: 65, vat_charges: 66,
  ifc_transferred: 69,
  marketing: 72,
  misc: 75,
  food_safety: 78, pic: 79,
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
      // Read all input cells (column C) at once
      const ranges = Object.entries(ITEM_ROW_MAP).map(
        ([, row]) => `'${sheetName}'!C${row}`
      );
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SHEET_ID,
        ranges,
      });

      // Build result object
      const result = {};
      const valueRanges = response.data.valueRanges || [];
      Object.keys(ITEM_ROW_MAP).forEach((id, i) => {
        const val = valueRanges[i]?.values?.[0]?.[0];
        result[id] = val || '';
      });

      return res.status(200).json({ data: result });
    }

    if (req.method === 'POST') {
      const { data } = req.body; // { card_sale: 50000, cash_pos: 0, ... }

      // Build batch update — only update column C cells
      const dataValues = [];
      for (const [id, value] of Object.entries(data)) {
        const row = ITEM_ROW_MAP[id];
        if (row) {
          dataValues.push({
            range: `'${sheetName}'!C${row}`,
            values: [[value === '' ? null : Number(value) || 0]],
          });
        }
      }

      if (dataValues.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            valueInputOption: 'RAW',
            data: dataValues,
          },
        });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Sheets API error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

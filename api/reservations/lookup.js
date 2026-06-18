import { lookupReservation } from '../../server/reservation-lookup.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    let params = req.body;
    if (typeof params === 'string') params = JSON.parse(params);

    const result = await lookupReservation(params);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.message?.includes('não encontr') ? 404 : 500;
    return res.status(status).json({ success: false, error: err.message });
  }
}

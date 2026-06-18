import { searchFlightsServer } from '../../server/flights-search.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', flights: [], source: null });
  }

  try {
    let params = req.body;
    if (typeof params === 'string') params = JSON.parse(params);
    if (!params || !params.origin || !params.destination || !params.departDate) {
      return res.status(400).json({ error: 'Parâmetros inválidos', flights: [], source: null });
    }

    const result = await searchFlightsServer(params, process.env);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[api/flights/search]', err);
    return res.status(500).json({ error: err.message, flights: [], source: null });
  }
}

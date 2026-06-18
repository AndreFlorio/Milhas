import { lookupTapReservation } from './scrapers/tap.js';

const SUPPORTED = {
  TP: { name: 'TAP Air Portugal', lookup: lookupTapReservation },
};

export async function lookupReservation({ airline, locator, lastName }) {
  if (!airline || !locator || !lastName) {
    throw new Error('Companhia, localizador e sobrenome são obrigatórios.');
  }

  const code = airline.toUpperCase();
  const provider = SUPPORTED[code];

  if (!provider) {
    throw new Error(`Consulta automática disponível apenas para: ${Object.keys(SUPPORTED).join(', ')}. Use adição manual para outras companhias.`);
  }

  const result = await provider.lookup(locator.trim(), lastName.trim());
  return result;
}

export function createReservationLookupMiddleware() {
  return async (req, res, next) => {
    if (req.url !== '/api/reservations/lookup' || req.method !== 'POST') {
      return next();
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const params = JSON.parse(body);
        const result = await lookupReservation(params);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = err.message.includes('não encontr') ? 404 : 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  };
}

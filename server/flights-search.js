/**
 * Provedores de busca de voos (SerpAPI → Amadeus → vazio)
 * Chaves ficam apenas no servidor (.env local ou Vercel Environment Variables).
 */

let cachedAmadeusToken = null;
let amadeusTokenExpiry = 0;

const AIRLINE_NAME_MAP = {
  azul: 'AD',
  latam: 'LA',
  gol: 'G3',
  tap: 'TP',
  american: 'AA',
  avianca: 'O6',
  united: 'UA',
  delta: 'DL',
  'air france': 'AF',
  iberia: 'IB',
};

const AIRLINE_SITES = {
  AD: 'https://www.voeazul.com.br',
  LA: 'https://www.latamairlines.com/br/pt',
  G3: 'https://www.voegol.com.br',
  TP: 'https://www.flytap.com/pt-br',
  AA: 'https://www.aa.com',
  O6: 'https://www.avianca.com/br/pt',
  UA: 'https://www.united.com',
  DL: 'https://www.delta.com',
  AF: 'https://www.airfrance.com.br',
  IB: 'https://www.iberia.com/br',
};

function normalizeAirlineCode(code) {
  const aliases = { AV: 'O6', JJ: 'LA', '2Z': 'AD', UX: 'O6' };
  if (!code) return 'LA';
  const upper = code.toUpperCase();
  return aliases[upper] || upper;
}

function airlineFromName(name) {
  if (!name) return 'LA';
  const lower = name.toLowerCase();
  for (const [key, code] of Object.entries(AIRLINE_NAME_MAP)) {
    if (lower.includes(key)) return code;
  }
  return normalizeAirlineCode(name.slice(0, 2));
}

function airlineFromSegment(segment) {
  const fromNumber = segment.flight_number?.split(/\s+/)[0];
  if (fromNumber && /^[A-Z0-9]{2,3}$/i.test(fromNumber)) {
    return normalizeAirlineCode(fromNumber);
  }
  const logoMatch = segment.airline_logo?.match(/\/([A-Z0-9]{2})\.png/i);
  if (logoMatch) return normalizeAirlineCode(logoMatch[1]);
  return airlineFromName(segment.airline);
}

function parseTime(datetime) {
  if (!datetime) return { date: '', time: '' };
  const [date, time] = datetime.split(' ');
  return { date, time: time?.slice(0, 5) || '' };
}

function buildGoogleFlightsUrl(origin, destination, departDate, returnDate) {
  const q = returnDate
    ? `Voos de ${origin} para ${destination} em ${departDate} retorno ${returnDate}`
    : `Voos de ${origin} para ${destination} em ${departDate}`;
  return `https://www.google.com/travel/flights/search?q=${encodeURIComponent(q)}&hl=pt-BR&gl=br&curr=BRL`;
}

function mapSerpApiOffer(offer, passengers, index, meta) {
  const segments = offer.flights || [];
  if (!segments.length) return null;

  const first = segments[0];
  const last = segments[segments.length - 1];
  const dep = parseTime(first.departure_airport?.time);
  const arr = parseTime(last.arrival_airport?.time);
  const stops = segments.length - 1;
  const airline = airlineFromSegment(first);
  const pricePerPerson = Math.round(offer.price || 0);

  return {
    id: `serp-${index}-${first.flight_number?.replace(/\s/g, '') || index}`,
    airline,
    airlineName: first.airline,
    origin: first.departure_airport?.id,
    destination: last.arrival_airport?.id,
    departureTime: dep.time,
    arrivalTime: arr.time,
    duration: offer.total_duration || segments.reduce((s, seg) => s + (seg.duration || 0), 0),
    stops,
    connectionAirport: stops > 0 ? segments[0].arrival_airport?.id : null,
    nextDay: arr.date && dep.date && arr.date !== dep.date,
    price: pricePerPerson * passengers,
    pricePerPerson,
    departDate: dep.date,
    passengers,
    flightNumber: (first.flight_number || '').replace(/\s/g, ''),
    airlineLogo: first.airline_logo || offer.airline_logo,
    source: 'serpapi',
    sourceLabel: 'Google Flights',
    verifyUrl: meta.googleFlightsUrl,
    airlineUrl: AIRLINE_SITES[airline] || null,
    searchedAt: meta.searchedAt,
  };
}

export async function searchSerpApi(params, apiKey) {
  const query = new URLSearchParams({
    engine: 'google_flights',
    api_key: apiKey,
    departure_id: params.origin,
    arrival_id: params.destination,
    outbound_date: params.departDate,
    type: params.returnDate ? '1' : '2',
    currency: 'BRL',
    hl: 'pt',
    gl: 'br',
    adults: String(params.passengers || 1),
    show_hidden: 'true',
  });

  if (params.returnDate) {
    query.set('return_date', params.returnDate);
  }

  const res = await fetch(`https://serpapi.com/search.json?${query}`);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || `SerpAPI HTTP ${res.status}`);
  }

  const offers = [...(data.best_flights || []), ...(data.other_flights || [])];
  const passengers = params.passengers || 1;
  const googleFlightsUrl = data.search_metadata?.google_flights_url
    || buildGoogleFlightsUrl(params.origin, params.destination, params.departDate, params.returnDate);
  const searchedAt = data.search_metadata?.processed_at || new Date().toISOString();
  const meta = { googleFlightsUrl, searchedAt };

  const flights = offers
    .map((offer, i) => mapSerpApiOffer(offer, passengers, i, meta))
    .filter(Boolean)
    .sort((a, b) => a.pricePerPerson - b.pricePerPerson);

  return { flights, verifyUrl: googleFlightsUrl, searchedAt };
}

function parseAmadeusDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const h = parseInt(match?.[1] || '0', 10);
  const m = parseInt(match?.[2] || '0', 10);
  return h * 60 + m;
}

function mapAmadeusOffer(offer, origin, destination, passengers, verifyUrl) {
  const itinerary = offer.itineraries[0];
  const segments = itinerary.segments;
  const first = segments[0];
  const last = segments[segments.length - 1];
  const depDate = new Date(first.departure.at);
  const arrDate = new Date(last.arrival.at);
  const airline = normalizeAirlineCode(offer.validatingAirlineCodes?.[0] || first.carrierCode);
  const price = Math.round(parseFloat(offer.price.total));

  return {
    id: offer.id,
    airline,
    airlineName: airline,
    origin,
    destination,
    departureTime: depDate.toTimeString().slice(0, 5),
    arrivalTime: arrDate.toTimeString().slice(0, 5),
    duration: parseAmadeusDuration(itinerary.duration),
    stops: segments.length - 1,
    connectionAirport: segments.length > 1 ? segments[0].arrival.iataCode : null,
    nextDay: arrDate.toDateString() !== depDate.toDateString(),
    price: price * passengers,
    pricePerPerson: price,
    departDate: first.departure.at.split('T')[0],
    passengers,
    flightNumber: `${first.carrierCode}${first.number}`,
    source: 'amadeus',
    sourceLabel: 'Amadeus',
    verifyUrl,
    airlineUrl: AIRLINE_SITES[airline] || null,
  };
}

async function getAmadeusToken(clientId, clientSecret) {
  if (cachedAmadeusToken && Date.now() < amadeusTokenExpiry) return cachedAmadeusToken;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error('Falha na autenticação Amadeus');
  const data = await res.json();
  cachedAmadeusToken = data.access_token;
  amadeusTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedAmadeusToken;
}

export async function searchAmadeus(params, clientId, clientSecret) {
  const token = await getAmadeusToken(clientId, clientSecret);
  const query = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departDate,
    adults: String(params.passengers || 1),
    currencyCode: 'BRL',
    max: '50',
    nonStop: 'false',
  });

  if (params.returnDate) query.set('returnDate', params.returnDate);

  const apiRes = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!apiRes.ok) throw new Error(await apiRes.text());

  const data = await apiRes.json();
  const passengers = params.passengers || 1;
  const verifyUrl = buildGoogleFlightsUrl(params.origin, params.destination, params.departDate, params.returnDate);

  const flights = (data.data || []).map(o =>
    mapAmadeusOffer(o, params.origin, params.destination, passengers, verifyUrl)
  );

  return { flights, verifyUrl, searchedAt: new Date().toISOString() };
}

export async function searchFlightsServer(params, env) {
  const serpKey = env.SERPAPI_KEY || env.VITE_SERPAPI_KEY;

  if (serpKey) {
    try {
      const { flights, verifyUrl, searchedAt } = await searchSerpApi(params, serpKey);
      if (flights.length > 0) {
        return { flights, source: 'serpapi', verifyUrl, searchedAt };
      }
    } catch (err) {
      console.error('[SerpAPI]', err.message);
    }
  }

  const clientId = env.VITE_AMADEUS_CLIENT_ID || env.AMADEUS_CLIENT_ID;
  const clientSecret = env.VITE_AMADEUS_CLIENT_SECRET || env.AMADEUS_CLIENT_SECRET;

  if (clientId && clientSecret) {
    try {
      const { flights, verifyUrl, searchedAt } = await searchAmadeus(params, clientId, clientSecret);
      if (flights.length > 0) {
        return { flights, source: 'amadeus', verifyUrl, searchedAt };
      }
    } catch (err) {
      console.error('[Amadeus]', err.message);
    }
  }

  return { flights: [], source: null, verifyUrl: null, searchedAt: null };
}

export function createFlightSearchMiddleware(env) {
  return async (req, res, next) => {
    if (req.url !== '/api/flights/search' || req.method !== 'POST') {
      return next();
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const params = JSON.parse(body);
        const result = await searchFlightsServer(params, env);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message, flights: [], source: null }));
      }
    });
  };
}

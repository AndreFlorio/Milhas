/**
 * Provedores de busca de voos (SerpAPI → Amadeus → vazio)
 * Chaves ficam apenas no servidor (.env), nunca no bundle do cliente.
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

function mapSerpApiOffer(offer, passengers, index) {
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

  const flights = offers
    .map((offer, i) => mapSerpApiOffer(offer, passengers, i))
    .filter(Boolean)
    .sort((a, b) => a.pricePerPerson - b.pricePerPerson);

  return flights;
}

function parseAmadeusDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const h = parseInt(match?.[1] || '0', 10);
  const m = parseInt(match?.[2] || '0', 10);
  return h * 60 + m;
}

function mapAmadeusOffer(offer, origin, destination, passengers) {
  const itinerary = offer.itineraries[0];
  const segments = itinerary.segments;
  const first = segments[0];
  const last = segments[segments.length - 1];
  const depDate = new Date(first.departure.at);
  const arrDate = new Date(last.arrival.at);
  const airline = offer.validatingAirlineCodes?.[0] || first.carrierCode;
  const price = Math.round(parseFloat(offer.price.total));

  return {
    id: offer.id,
    airline: normalizeAirlineCode(airline),
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
  return (data.data || []).map(o =>
    mapAmadeusOffer(o, params.origin, params.destination, passengers)
  );
}

export async function searchFlightsServer(params, env) {
  const serpKey = env.SERPAPI_KEY || env.VITE_SERPAPI_KEY;

  if (serpKey) {
    try {
      const flights = await searchSerpApi(params, serpKey);
      if (flights.length > 0) {
        return { flights, source: 'serpapi' };
      }
    } catch (err) {
      console.error('[SerpAPI]', err.message);
    }
  }

  const clientId = env.VITE_AMADEUS_CLIENT_ID;
  const clientSecret = env.VITE_AMADEUS_CLIENT_SECRET;

  if (clientId && clientSecret) {
    try {
      const flights = await searchAmadeus(params, clientId, clientSecret);
      if (flights.length > 0) {
        return { flights, source: 'amadeus' };
      }
    } catch (err) {
      console.error('[Amadeus]', err.message);
    }
  }

  return { flights: [], source: null };
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

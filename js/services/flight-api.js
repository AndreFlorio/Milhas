import { generateFlights } from '../data/flights.js';
import { getAirline, normalizeAirlineCode } from '../data/airlines.js';
import { getAirport } from '../data/airports.js';

/**
 * Busca voos: SerpAPI (Google Flights) → Amadeus → simulado
 */
export async function searchFlights({ origin, destination, departDate, returnDate, passengers = 1 }) {
  try {
    const res = await fetch('/api/flights/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, departDate, returnDate, passengers }),
    });

    const data = await res.json().catch(() => ({}));

    if (data.flights?.length > 0) {
      return {
        flights: enrichFlights(data.flights, origin, destination),
        source: data.source || 'serpapi',
      };
    }
  } catch {
    // fallback
  }

  const mock = generateFlights(origin, destination, departDate, returnDate, passengers);
  return {
    flights: enrichFlights(mock, origin, destination),
    source: 'simulated',
  };
}

function enrichFlights(flights, origin, destination) {
  const originAirport = getAirport(origin);
  const destAirport = getAirport(destination);

  return flights.map(f => {
    const code = normalizeAirlineCode(f.airline);
    const airline = getAirline(code);
    return {
      ...f,
      airline: code,
      airlineName: f.airlineName || airline.name,
      originCity: getAirport(f.origin)?.city || originAirport?.city || origin,
      destinationCity: getAirport(f.destination)?.city || destAirport?.city || destination,
    };
  });
}

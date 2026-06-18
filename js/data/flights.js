import { airlines } from './airlines.js';
import { getAirport } from './airports.js';

/**
 * Generate realistic mock flight results based on search params
 */
export function generateFlights(origin, destination, departDate, returnDate, passengers = 1) {
  const flights = [];
  const originAirport = getAirport(origin);
  const destAirport = getAirport(destination);
  
  if (!originAirport || !destAirport) return flights;

  // Determine which airlines fly this route
  const isInternational = originAirport.country !== destAirport.country;
  const isDomesticBR = originAirport.country === 'BR' && destAirport.country === 'BR';
  
  let routeAirlines;
  if (isDomesticBR) {
    routeAirlines = airlines.filter(a => ['LA', 'AD', 'G3'].includes(a.code));
  } else if (isInternational) {
    routeAirlines = airlines.filter(a => ['LA', 'AD', 'TP', 'AA', 'AF', 'UA', 'DL', 'IB'].includes(a.code));
    // Filter based on destination
    if (destAirport.country === 'PT' || destAirport.country === 'ES') {
      routeAirlines = airlines.filter(a => ['LA', 'TP', 'IB', 'AF'].includes(a.code));
    } else if (destAirport.country === 'US') {
      routeAirlines = airlines.filter(a => ['LA', 'AD', 'AA', 'UA', 'DL', 'G3'].includes(a.code));
    } else if (destAirport.country === 'FR') {
      routeAirlines = airlines.filter(a => ['LA', 'AF', 'TP'].includes(a.code));
    }
  } else {
    routeAirlines = airlines.filter(a => ['LA', 'AD', 'G3', 'O6'].includes(a.code));
  }

  // Generate departure times
  const departureTimes = ['06:00', '07:30', '08:45', '10:15', '11:30', '13:00', '14:20', '15:45', '17:00', '18:30', '20:00', '21:15', '22:40', '23:30'];
  
  // Calculate base price
  let basePrice;
  if (isDomesticBR) {
    basePrice = 400 + Math.random() * 800;
  } else if (isInternational) {
    basePrice = 2500 + Math.random() * 4000;
  } else {
    basePrice = 1200 + Math.random() * 2000;
  }

  // Calculate approximate flight duration in minutes
  let baseDuration;
  if (isDomesticBR) {
    baseDuration = 90 + Math.random() * 180;
  } else {
    baseDuration = 480 + Math.random() * 600;
  }

  // Generate flights for each airline
  routeAirlines.forEach(airline => {
    const numFlights = Math.floor(2 + Math.random() * 4);
    const usedTimes = new Set();
    
    for (let i = 0; i < numFlights; i++) {
      let depTime;
      do {
        depTime = departureTimes[Math.floor(Math.random() * departureTimes.length)];
      } while (usedTimes.has(depTime));
      usedTimes.add(depTime);

      const stops = Math.random() < 0.3 ? 0 : (Math.random() < 0.6 ? 1 : 2);
      const durationMinutes = Math.round(baseDuration + (stops * (60 + Math.random() * 120)));
      const priceVariation = 0.7 + Math.random() * 0.8;
      const stopsPriceModifier = stops === 0 ? 1.3 : (stops === 1 ? 1 : 0.85);
      const price = Math.round(basePrice * priceVariation * stopsPriceModifier);

      // Calculate arrival time
      const [depHour, depMin] = depTime.split(':').map(Number);
      const totalMinutes = depHour * 60 + depMin + durationMinutes;
      const arrHour = Math.floor(totalMinutes / 60) % 24;
      const arrMin = totalMinutes % 60;
      const nextDay = totalMinutes >= 24 * 60;
      const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;

      // Determine connecting airport
      let connectionAirport = null;
      if (stops > 0 && isDomesticBR) {
        const connections = ['GRU', 'BSB', 'CNF', 'GIG'].filter(c => c !== origin && c !== destination);
        connectionAirport = connections[Math.floor(Math.random() * connections.length)];
      } else if (stops > 0 && isInternational) {
        const connections = ['GRU', 'LIS', 'MAD', 'MIA', 'ATL', 'CDG'].filter(c => c !== origin && c !== destination);
        connectionAirport = connections[Math.floor(Math.random() * connections.length)];
      }

      flights.push({
        id: `${airline.code}${Math.floor(1000 + Math.random() * 9000)}`,
        airline: airline.code,
        airlineName: airline.name,
        origin,
        destination,
        departureTime: depTime,
        arrivalTime: arrTime,
        duration: durationMinutes,
        stops,
        connectionAirport,
        nextDay,
        price: price * passengers,
        pricePerPerson: price,
        departDate,
        returnDate,
        passengers,
        originCity: originAirport.city,
        destinationCity: destAirport.city,
      });
    }
  });

  // Sort by price
  flights.sort((a, b) => a.price - b.price);
  
  return flights;
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

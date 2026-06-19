/**
 * TAP — consulta via API Direta
 */
import { normalizeLastName } from '../browser.js';

const API_SESSION_URL = 'https://myb.flytap.com/bfm/rest/session/create';
const API_PNR_URL = 'https://myb.flytap.com/bfm/rest/booking/pnrs/search?skipAncillariesCatalogue=true';

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  }
}

async function fetchApiSession() {
  const clientId = "-bqBinBiHz4Yg+87BN+PU3TaXUWyRrn1T/iV/LjxgeSA=";
  const clientSecret = "DxKLkFeWzANc4JSIIarjoPSr6M+cXv1rcqWry2QV2Azr5EutGYR/oJ79IT3fMR+qM5H/RArvIPtyquvjHebM1Q==";
  
  const response = await fetch(API_SESSION_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'origin': 'https://myb.flytap.com',
      'referer': 'https://myb.flytap.com/my-bookings',
      'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
      "referralId": "h7g+cmbKWJ3XmZajrMhyUpp9.cms35",
      "market": "BR",
      "language": "pt",
      "userProfile": null,
      "appModule": "0"
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create API session: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.id) {
    throw new Error(`No JWT token (id) found in session response. Response: ${JSON.stringify(data)}`);
  }
  
  return data.id;
}

async function fetchApiPnr(token, pnr, lastName) {
  const response = await fetch(API_PNR_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'origin': 'https://myb.flytap.com',
      'referer': `https://myb.flytap.com/my-bookings/details/${pnr.toUpperCase()}/${normalizeLastName(lastName)}`,
      'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    },
    body: JSON.stringify({
      lastName: normalizeLastName(lastName),
      pnrNumber: pnr.toUpperCase()
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PNR data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

function parseApiResponse(json, pnr, originalLastName) {
  if (json.errors && json.errors.length > 0) {
    const errorMsg = json.errors[0]?.message || 'Erro retornado pela API da TAP';
    throw new Error(`A API da TAP retornou um erro: ${errorMsg}`);
  }

  const data = json.data;
  if (!data || !data.pnr) {
    throw new Error(`Reserva não encontrada. A API da TAP retornou dados vazios. JSON: ${JSON.stringify(json)}`);
  }

  // Passengers
  const passengers = data.infoPax?.listPax?.map(pax => ({
    name: `${pax.name} ${pax.surname}`.trim(),
    ticketNumber: data.infoTicket?.listTicket?.find(t => t.idPax === pax.idPax)?.ticket || null,
    seat: '—', // Typically requires ancillary check, defaulting to empty
    email: pax.email || data.passengerContact?.email || null,
    phone: pax.phone || data.passengerContact?.telephone?.number || null,
    checkinStatus: 'Confirmado'
  })) || [];

  // Outbound
  let outbound = null;
  const outData = data.fare?.listOutbound?.[0];
  if (outData) {
    const firstSeg = outData.firstSegment || outData.listSegment?.[0];
    const lastSeg = outData.lastSegment || outData.listSegment?.[outData.listSegment?.length - 1];
    
    outbound = {
      origin: firstSeg?.departureAirport,
      destination: lastSeg?.arrivalAirport,
      flightNumber: `${firstSeg?.carrier}${firstSeg?.flightNumber}`,
      date: firstSeg?.departureDate, // Returns ISO like 2026-06-23T23:25:00.000Z
      status: (firstSeg?.status?.includes('39') || data.statusBook === 'OK') ? 'Confirmado' : data.statusBook,
      duration: outData.duration
    };
  }

  // Inbound
  let inbound = null;
  const inData = data.fare?.listInbound?.[0] || data.fare?.inbound?.[0]; // If exists
  if (inData) {
    const firstSeg = inData.firstSegment || inData.listSegment?.[0];
    const lastSeg = inData.lastSegment || inData.listSegment?.[inData.listSegment?.length - 1];
    
    inbound = {
      origin: firstSeg?.departureAirport,
      destination: lastSeg?.arrivalAirport,
      flightNumber: `${firstSeg?.carrier}${firstSeg?.flightNumber}`,
      date: firstSeg?.departureDate,
      status: (firstSeg?.status?.includes('39') || data.statusBook === 'OK') ? 'Confirmado' : data.statusBook,
      duration: inData.duration
    };
  }
  
  // Value
  const totalPrice = data.fare?.flightPrice?.totalPrice?.price || 0;
  const currency = data.fare?.flightPrice?.totalPrice?.currency || 'BRL';

  // Baggage (simplified)
  const hasCheckedBag = data.whatsInclude?.['1']?.includes('FBAG') || false;
  const baggage = [
    { label: 'Item pessoal', weight: '10kg', count: 1 },
    { label: 'Mala de mão', weight: '10kg', count: 1 },
    { label: 'Despachada', weight: '23kg', count: hasCheckedBag ? 1 : 0 }
  ];

  return {
    success: true,
    source: 'tap-direct-api',
    sourceLabel: 'TAP Air Portugal (API Direta)',
    verifyUrl: `https://myb.flytap.com/my-bookings/details/${pnr.toUpperCase()}/${normalizeLastName(originalLastName)}`,
    airline: 'TP',
    locator: pnr.toUpperCase(),
    lastName: normalizeLastName(originalLastName),
    status: data.statusBook === 'OK' ? 'Confirmado' : (data.statusBook === 'CANCELLED' ? 'Cancelada' : data.statusBook),
    passengers,
    outbound,
    inbound,
    baggage,
    contact: { 
      email: data.passengerContact?.email || null, 
      phone: data.passengerContact?.telephone?.number || null 
    },
    value: totalPrice,
    currency,
    fetchedAt: new Date().toISOString(),
  };
}

export async function lookupTapReservation(locator, lastName) {
  log('=== STARTING TAP PURE API SCRAPER ===');
  log(`Requested PNR: ${locator}, Surname: ${lastName}`);
  
  try {
    const token = await fetchApiSession();
    log('JWT Session Token acquired');
    
    const pnrData = await fetchApiPnr(token, locator, lastName);
    log('PNR Data fetched successfully');
    
    const result = parseApiResponse(pnrData, locator, lastName);
    log('=== SCRAPER COMPLETED SUCCESSFULLY ===');
    
    return result;
  } catch (error) {
    log('API Lookup failed:', error.message);
    throw error;
  }
}

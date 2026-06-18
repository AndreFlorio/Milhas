export const airlines = [
  { code: 'LA', name: 'LATAM', color: '#1B1464', textColor: '#fff', fullName: 'LATAM Airlines' },
  { code: 'AD', name: 'Azul', color: '#2B3990', textColor: '#fff', fullName: 'Azul Linhas Aéreas' },
  { code: 'G3', name: 'GOL', color: '#FF6600', textColor: '#fff', fullName: 'GOL Linhas Aéreas' },
  { code: 'TP', name: 'TAP', color: '#00A651', textColor: '#fff', fullName: 'TAP Air Portugal' },
  { code: 'AA', name: 'American', color: '#0078D2', textColor: '#fff', fullName: 'American Airlines' },
  { code: 'O6', name: 'Avianca', color: '#ED1C24', textColor: '#fff', fullName: 'Avianca' },
  { code: 'AF', name: 'Air France', color: '#002157', textColor: '#fff', fullName: 'Air France' },
  { code: 'UA', name: 'United', color: '#002244', textColor: '#fff', fullName: 'United Airlines' },
  { code: 'DL', name: 'Delta', color: '#003366', textColor: '#fff', fullName: 'Delta Air Lines' },
  { code: 'IB', name: 'Iberia', color: '#D4213D', textColor: '#fff', fullName: 'Iberia' },
];

/** Códigos IATA da Amadeus → códigos internos */
const CODE_ALIASES = {
  AV: 'O6',
  JJ: 'LA',
  '2Z': 'AD',
  UX: 'O6',
};

export function normalizeAirlineCode(code) {
  if (!code) return 'LA';
  return CODE_ALIASES[code] || code;
}

export function getAirline(code) {
  const normalized = normalizeAirlineCode(code);
  const found = airlines.find(a => a.code === normalized);
  if (found) return found;
  return {
    code: normalized,
    name: normalized,
    color: '#475569',
    textColor: '#fff',
    fullName: normalized,
  };
}

export function getAirlineLogo(code) {
  const airline = getAirline(code);
  return `<div class="flight-airline-logo" style="background:${airline.color}">${airline.code}</div>`;
}

export function getAirlineSmallLogo(code) {
  const airline = getAirline(code);
  return `<div class="res-airline-icon" style="background:${airline.color}">${airline.code}</div>`;
}

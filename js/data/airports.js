export const airports = [
  // Brasil - Principais
  { code: 'GRU', city: 'São Paulo', name: 'Guarulhos', country: 'BR' },
  { code: 'CGH', city: 'São Paulo', name: 'Congonhas', country: 'BR' },
  { code: 'VCP', city: 'Campinas', name: 'Viracopos', country: 'BR' },
  { code: 'GIG', city: 'Rio de Janeiro', name: 'Galeão', country: 'BR' },
  { code: 'SDU', city: 'Rio de Janeiro', name: 'Santos Dumont', country: 'BR' },
  { code: 'BSB', city: 'Brasília', name: 'Juscelino Kubitschek', country: 'BR' },
  { code: 'CNF', city: 'Belo Horizonte', name: 'Confins', country: 'BR' },
  { code: 'SSA', city: 'Salvador', name: 'Deputado Luís Eduardo', country: 'BR' },
  { code: 'REC', city: 'Recife', name: 'Guararapes', country: 'BR' },
  { code: 'FOR', city: 'Fortaleza', name: 'Pinto Martins', country: 'BR' },
  { code: 'POA', city: 'Porto Alegre', name: 'Salgado Filho', country: 'BR' },
  { code: 'CWB', city: 'Curitiba', name: 'Afonso Pena', country: 'BR' },
  { code: 'FLN', city: 'Florianópolis', name: 'Hercílio Luz', country: 'BR' },
  { code: 'BEL', city: 'Belém', name: 'Val de Cans', country: 'BR' },
  { code: 'MAO', city: 'Manaus', name: 'Eduardo Gomes', country: 'BR' },
  { code: 'NAT', city: 'Natal', name: 'São Gonçalo do Amarante', country: 'BR' },
  { code: 'MCZ', city: 'Maceió', name: 'Zumbi dos Palmares', country: 'BR' },
  { code: 'GYN', city: 'Goiânia', name: 'Santa Genoveva', country: 'BR' },
  { code: 'VIX', city: 'Vitória', name: 'Eurico de Aguiar Salles', country: 'BR' },
  { code: 'CGB', city: 'Cuiabá', name: 'Marechal Rondon', country: 'BR' },

  // Internacional - América do Norte
  { code: 'JFK', city: 'Nova York', name: 'John F. Kennedy', country: 'US' },
  { code: 'LGA', city: 'Nova York', name: 'LaGuardia', country: 'US' },
  { code: 'EWR', city: 'Nova York', name: 'Newark', country: 'US' },
  { code: 'MIA', city: 'Miami', name: 'Miami International', country: 'US' },
  { code: 'MCO', city: 'Orlando', name: 'Orlando International', country: 'US' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', country: 'US' },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International", country: 'US' },
  { code: 'ATL', city: 'Atlanta', name: 'Hartsfield-Jackson', country: 'US' },
  { code: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth', country: 'US' },
  { code: 'YYZ', city: 'Toronto', name: 'Pearson International', country: 'CA' },
  { code: 'MEX', city: 'Cidade do México', name: 'Benito Juárez', country: 'MX' },
  { code: 'CUN', city: 'Cancún', name: 'Cancún International', country: 'MX' },

  // Europa
  { code: 'LIS', city: 'Lisboa', name: 'Humberto Delgado', country: 'PT' },
  { code: 'OPO', city: 'Porto', name: 'Francisco Sá Carneiro', country: 'PT' },
  { code: 'MAD', city: 'Madri', name: 'Barajas', country: 'ES' },
  { code: 'BCN', city: 'Barcelona', name: 'El Prat', country: 'ES' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'FR' },
  { code: 'FCO', city: 'Roma', name: 'Fiumicino', country: 'IT' },
  { code: 'LHR', city: 'Londres', name: 'Heathrow', country: 'GB' },
  { code: 'AMS', city: 'Amsterdã', name: 'Schiphol', country: 'NL' },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'DE' },
  { code: 'DUB', city: 'Dublin', name: 'Dublin Airport', country: 'IE' },

  // América do Sul
  { code: 'EZE', city: 'Buenos Aires', name: 'Ezeiza', country: 'AR' },
  { code: 'SCL', city: 'Santiago', name: 'Arturo Merino Benítez', country: 'CL' },
  { code: 'BOG', city: 'Bogotá', name: 'El Dorado', country: 'CO' },
  { code: 'LIM', city: 'Lima', name: 'Jorge Chávez', country: 'PE' },
  { code: 'MVD', city: 'Montevidéu', name: 'Carrasco', country: 'UY' },
  { code: 'ASU', city: 'Assunção', name: 'Silvio Pettirossi', country: 'PY' },
];

export function searchAirports(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return airports.filter(a =>
    a.code.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function getAirport(code) {
  return airports.find(a => a.code === code);
}

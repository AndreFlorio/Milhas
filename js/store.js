/**
 * Store - Manages application state with localStorage persistence
 */

const STORAGE_KEYS = {
  RESERVATIONS: 'pastmilhas_reservations',
  RECENT_SEARCHES: 'pastmilhas_recent_searches',
  WALLET: 'pastmilhas_wallet',
};

// Default reservations data (sample data like in screenshots)
const defaultReservations = [
  {
    id: '1',
    locator: 'ZN48VF',
    airline: 'TP',
    passengers: [{ name: 'Ananery Rochadonascimento' }],
    outbound: { origin: 'LIS', destination: 'GIG', status: 'Fechado', date: '2026-06-23T23:25' },
    inbound: null,
    description: '',
    value: 0,
    status: 'Confirmado',
    createdAt: '2026-06-01',
  },
  {
    id: '2',
    locator: 'ZLHBXJ',
    airline: 'TP',
    passengers: [{ name: 'Lucas Dantasdesa' }],
    outbound: { origin: 'LIS', destination: 'REC', status: 'Fechado', date: '2026-08-31T16:50' },
    inbound: { origin: 'REC', destination: 'LIS', status: 'Fechado', date: '2026-09-14T04:35' },
    description: '',
    value: 0,
    status: 'Confirmado',
    createdAt: '2026-05-20',
  },
  {
    id: '3',
    locator: 'ZIFVPT',
    airline: 'TP',
    passengers: [{ name: 'Joaopedro Gomidedosantos' }, { name: 'Maria Santos' }],
    outbound: { origin: 'LIS', destination: 'GRU', status: 'Fechado', date: '2026-07-02T13:00' },
    inbound: { origin: 'GRU', destination: 'LIS', status: 'Fechado', date: '2026-07-28T15:30' },
    description: '',
    value: 0,
    status: 'Confirmado',
    createdAt: '2026-05-15',
  },
  {
    id: '4',
    locator: 'Z8DHYO',
    airline: 'TP',
    passengers: [{ name: 'Keila Martins' }],
    outbound: { origin: 'BSB', destination: 'DUB', status: 'Fechado', date: '2026-07-14T17:25' },
    inbound: null,
    description: '',
    value: 0,
    status: 'Confirmado',
    createdAt: '2026-05-10',
  },
  {
    id: '5',
    locator: 'AEZZUM',
    airline: 'AD',
    passengers: [{ name: 'Denise Silva' }, { name: 'Carlos Silva' }],
    outbound: { origin: 'LIS', destination: 'GYN', status: 'Fechado', date: '2026-07-06T19:20' },
    inbound: { origin: 'GYN', destination: 'LIS', status: 'Fechado', date: '2026-09-14T19:45' },
    description: '',
    value: 0,
    status: 'Confirmado',
    createdAt: '2026-04-28',
  },
  {
    id: '6',
    locator: 'DZZQNZ',
    airline: 'TP',
    passengers: [{ name: 'Higor Alves' }],
    outbound: { origin: 'LIS', destination: 'GYN', status: 'Fechado', date: '2026-07-06T19:20' },
    inbound: { origin: 'GYN', destination: 'LIS', status: 'Fechado', date: '2026-08-03T19:40' },
    description: '',
    value: 0,
    status: 'Confirmado',
    createdAt: '2026-04-20',
  },
  {
    id: '7',
    locator: 'YZJE6W',
    airline: 'TP',
    passengers: [{ name: 'Rafael Mouramiranda1ma' }],
    outbound: { origin: 'OPO', destination: 'SSA', status: 'Fechado', date: '2026-06-26T22:30' },
    inbound: null,
    description: '',
    value: 0,
    status: 'Confirmado',
    createdAt: '2026-04-15',
  },
  {
    id: '8',
    locator: 'YX4UDH',
    airline: 'TP',
    passengers: [{ name: 'Jamesdean Gonzagadasilva' }],
    outbound: { origin: 'LIS', destination: 'BEL', status: 'Fechado', date: '2026-09-02T09:50' },
    inbound: null,
    description: '',
    value: 0,
    status: 'Confirmado',
    createdAt: '2026-04-10',
  },
];

class Store {
  constructor() {
    this._initDefaults();
  }

  _initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(defaultReservations));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES)) {
      localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify([
        { origin: 'GRU', destination: 'JFK', departDate: '2026-06-20', returnDate: '2026-07-01', passengers: 1, tripType: 'roundtrip' },
        { origin: 'GRU', destination: 'GIG', departDate: '2026-06-20', returnDate: '2026-07-01', passengers: 1, tripType: 'roundtrip' },
      ]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WALLET)) {
      localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify({ balance: 0 }));
    }
  }

  // === RESERVATIONS ===
  getReservations() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || '[]');
  }

  addReservation(reservation) {
    const reservations = this.getReservations();
    reservation.id = Date.now().toString();
    reservation.createdAt = new Date().toISOString().split('T')[0];
    reservations.unshift(reservation);
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    return reservation;
  }

  updateReservation(id, updates) {
    const reservations = this.getReservations();
    const index = reservations.findIndex(r => r.id === id);
    if (index >= 0) {
      reservations[index] = { ...reservations[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
      return reservations[index];
    }
    return null;
  }

  deleteReservation(id) {
    const reservations = this.getReservations().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  }

  getReservation(id) {
    return this.getReservations().find(r => r.id === id);
  }

  // === RECENT SEARCHES ===
  getRecentSearches() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || '[]');
  }

  addRecentSearch(search) {
    let searches = this.getRecentSearches();
    // Remove duplicate
    searches = searches.filter(s => !(s.origin === search.origin && s.destination === search.destination));
    searches.unshift(search);
    if (searches.length > 5) searches = searches.slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
  }

  clearRecentSearches() {
    localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify([]));
  }

  // === WALLET ===
  getWallet() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLET) || '{"balance":0}');
  }

  updateWalletBalance(amount) {
    const wallet = this.getWallet();
    wallet.balance = amount;
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
  }
}

export const store = new Store();

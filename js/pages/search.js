import { router } from '../router.js';
import { store } from '../store.js';
import { searchFlights } from '../services/flight-api.js';
import { airlines, getAirlineLogo } from '../data/airlines.js';
import { getAirport } from '../data/airports.js';
import { formatDuration } from '../data/flights.js';
import { formatCurrency, formatMonthYear, generateLocator, generateTicketNumber } from '../utils/formatters.js';

let searchParams = {};
let allFlights = [];
let filteredFlights = [];
let dataSource = 'simulated';
let verifyUrl = null;
let searchedAt = null;
let filters = {
  stops: 'all',
  airlines: [],
  maxPrice: Infinity,
  sort: 'price',
};

export async function renderSearch(params = {}) {
  searchParams = { ...params };
  filters = { stops: 'all', airlines: [], maxPrice: Infinity, sort: 'price' };
  allFlights = [];
  filteredFlights = [];

  const main = document.getElementById('main-content');
  const origin = getAirport(searchParams.origin);
  const dest = getAirport(searchParams.destination);

  main.innerHTML = `
    <div class="search-results-page">
      <div class="search-summary-bar">
        <div class="container search-summary">
          <div class="search-summary-left">
            <div class="search-summary-route">
              ${origin?.city || searchParams.origin}
              <span class="swap-icon">${searchParams.returnDate ? '⇄' : '→'}</span>
              ${dest?.city || searchParams.destination}
            </div>
            <div class="search-summary-details">
              <span>📅 ${formatMonthYear(searchParams.departDate)}${searchParams.returnDate ? ' – ' + formatMonthYear(searchParams.returnDate) : ''}</span>
              <span>👤 ${searchParams.passengers || 1} adulto${(searchParams.passengers || 1) > 1 ? 's' : ''}</span>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="modify-search">✏ Modificar</button>
        </div>
      </div>

      <div class="container">
        <div class="price-tabs" id="price-tabs">
          ${['Melhor Preço', 'Direto', '1 Conexão', 'Mais Rápido', 'Custo-Benefício'].map((label, i) => `
            <div class="price-tab ${i === 0 ? 'active' : ''}" data-tab="${i}">
              <div class="price-tab-label">${label}</div>
              <div class="price-tab-value" id="tab-value-${i}">—</div>
              <div class="price-tab-sub" id="tab-sub-${i}">Carregando...</div>
            </div>
          `).join('')}
        </div>

        <div class="search-layout">
          <aside class="filters-sidebar" id="filters-sidebar">
            <h3 class="filters-title">Filtros</h3>

            <div class="filter-group">
              <div class="filter-group-title">Paradas</div>
              <div class="filter-chips" id="stops-filter">
                <span class="filter-chip active" data-stops="all">Todos</span>
                <span class="filter-chip" data-stops="0">Direto</span>
                <span class="filter-chip" data-stops="1">1 conexão</span>
                <span class="filter-chip" data-stops="2">2+ conexões</span>
              </div>
            </div>

            <div class="filter-group" id="airline-filters">
              <div class="filter-group-title">Companhias</div>
            </div>

            <div class="filter-group">
              <div class="filter-group-title">Preço Máximo</div>
              <div class="filter-range">
                <input type="range" id="price-range" min="0" max="50000" step="100" value="50000" />
                <div class="filter-range-value" id="price-range-value">Sem limite</div>
              </div>
            </div>
          </aside>

          <div class="results-main">
            <div class="results-header">
              <div>
                <h2 class="results-title">Escolha um voo</h2>
                <span class="data-source-badge" id="data-source-badge"></span>
              </div>
              <div class="results-sort">
                Organizar por:
                <select id="sort-select">
                  <option value="price">Menor preço</option>
                  <option value="duration">Menor duração</option>
                  <option value="departure">Horário de partida</option>
                </select>
              </div>
            </div>

            <div class="loading-bar"><div class="loading-bar-fill" id="loading-fill" style="width:0%"></div></div>
            <div class="loading-sources" id="loading-sources">
              <span>Carregando voos...</span>
              ${airlines.slice(0, 6).map(a => `
                <span><div class="source-icon" style="background:${a.color}">${a.code}</div></span>
              `).join('')}
              <span id="loading-status">Aguarde</span>
            </div>

            <div class="flight-cards" id="flight-cards"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modify-search')?.addEventListener('click', () => router.navigate('/'));
  document.getElementById('sort-select')?.addEventListener('change', e => {
    filters.sort = e.target.value;
    applyFilters();
  });

  document.getElementById('stops-filter')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-stops]');
    if (!chip) return;
    document.querySelectorAll('#stops-filter .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filters.stops = chip.dataset.stops;
    applyFilters();
  });

  document.getElementById('price-range')?.addEventListener('input', e => {
    filters.maxPrice = parseInt(e.target.value);
    document.getElementById('price-range-value').textContent =
      filters.maxPrice >= 50000 ? 'Sem limite' : formatCurrency(filters.maxPrice);
    applyFilters();
  });

  await loadFlights();
}

async function loadFlights() {
  const fill = document.getElementById('loading-fill');
  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + 8, 90);
    if (fill) fill.style.width = progress + '%';
  }, 150);

  try {
    const result = await searchFlights({
      origin: searchParams.origin,
      destination: searchParams.destination,
      departDate: searchParams.departDate,
      returnDate: searchParams.returnDate,
      passengers: searchParams.passengers || 1,
    });
    allFlights = result.flights;
    dataSource = result.source;
    verifyUrl = result.verifyUrl;
    searchedAt = result.searchedAt;
  } catch {
    allFlights = [];
    dataSource = 'simulated';
  }

  clearInterval(interval);
  if (fill) fill.style.width = '100%';

  const status = document.getElementById('loading-status');
  if (status) status.textContent = `${allFlights.length} voos encontrados`;

  const badge = document.getElementById('data-source-badge');
  if (badge) {
    if (dataSource === 'serpapi') {
      badge.className = 'data-source-badge real';
      badge.innerHTML = verifyUrl
        ? `✓ Preços reais via Google Flights · <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" class="source-link">Abrir busca original ↗</a>${searchedAt ? ` · atualizado ${formatSearchedAt(searchedAt)}` : ''}`
        : '✓ Dados reais — Google Flights via SerpAPI';
    } else if (dataSource === 'amadeus') {
      badge.className = 'data-source-badge real';
      badge.innerHTML = verifyUrl
        ? `✓ Dados reais via Amadeus · <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" class="source-link">Verificar no Google Flights ↗</a>`
        : '✓ Dados reais — Amadeus';
    } else {
      badge.className = 'data-source-badge simulated';
      badge.innerHTML = '⚠ Dados simulados — adicione <strong>SERPAPI_KEY</strong> em Vercel → Settings → Environment Variables e faça redeploy';
    }
  }

  setTimeout(() => {
    document.querySelector('.loading-bar')?.remove();
    document.getElementById('loading-sources')?.remove();
  }, 600);

  buildAirlineFilters();
  updatePriceTabs();
  applyFilters();
}

function buildAirlineFilters() {
  const container = document.getElementById('airline-filters');
  if (!container) return;

  const counts = {};
  allFlights.forEach(f => { counts[f.airline] = (counts[f.airline] || 0) + 1; });

  const airlineList = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  container.innerHTML = `
    <div class="filter-group-title">Companhias</div>
    ${airlineList.map(([code, count]) => {
      const a = airlines.find(x => x.code === code) || { name: code, color: '#666' };
      return `
        <div class="filter-airline">
          <label>
            <input type="checkbox" value="${code}" checked />
            <div class="res-airline-icon" style="background:${a.color};width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:8px;font-weight:bold">${code}</div>
            ${a.name}
          </label>
          <span class="count">${count}</span>
        </div>
      `;
    }).join('')}
  `;

  filters.airlines = airlineList.map(([code]) => code);

  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      filters.airlines = [...container.querySelectorAll('input:checked')].map(c => c.value);
      applyFilters();
    });
  });
}

function updatePriceTabs() {
  if (!allFlights.length) return;

  const cheapest = allFlights[0];
  const direct = allFlights.filter(f => f.stops === 0);
  const oneStop = allFlights.filter(f => f.stops === 1);
  const fastest = [...allFlights].sort((a, b) => a.duration - b.duration)[0];

  const tabs = [
    { flight: cheapest, label: cheapest ? `${cheapest.airlineName}` : '—' },
    { flight: direct[0], label: direct.length ? `${direct[0].airlineName}` : 'Sem voos diretos' },
    { flight: oneStop[0] || cheapest, label: oneStop.length ? `${oneStop[0].airlineName}` : `${cheapest?.airlineName}` },
    { flight: fastest, label: fastest ? `${fastest.airlineName} · ${formatDuration(fastest.duration)}` : '—' },
    { flight: cheapest, label: cheapest ? `${cheapest.airlineName}` : '—' },
  ];

  tabs.forEach((tab, i) => {
    const val = document.getElementById(`tab-value-${i}`);
    const sub = document.getElementById(`tab-sub-${i}`);
    if (val) val.textContent = tab.flight ? formatCurrency(tab.flight.pricePerPerson) : '—';
    if (sub) sub.textContent = tab.label;
  });
}

function applyFilters() {
  filteredFlights = allFlights.filter(f => {
    if (filters.stops !== 'all') {
      const s = parseInt(filters.stops);
      if (s === 2 ? f.stops < 2 : f.stops !== s) return false;
    }
    if (filters.airlines.length && !filters.airlines.includes(f.airline)) return false;
    if (f.pricePerPerson > filters.maxPrice) return false;
    return true;
  });

  if (filters.sort === 'price') filteredFlights.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
  else if (filters.sort === 'duration') filteredFlights.sort((a, b) => a.duration - b.duration);
  else filteredFlights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  renderFlightCards();
}

function renderFlightCards() {
  const container = document.getElementById('flight-cards');
  if (!container) return;

  if (!filteredFlights.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✈</div>
        <h3 class="empty-state-title">Nenhum voo encontrado</h3>
        <p>Tente ajustar os filtros ou modificar a busca.</p>
      </div>
    `;
    return;
  }

  const cheapestPrice = filteredFlights[0]?.pricePerPerson;

  container.innerHTML = filteredFlights.map(f => {
    const stopsLabel = f.stops === 0 ? 'Direto' : f.stops === 1 ? '1 conexão' : `${f.stops} conexões`;
    const isCheapest = f.pricePerPerson === cheapestPrice;

    return `
      <div class="flight-card ${isCheapest ? 'cheapest' : ''}" data-flight-id="${f.id}">
        <div class="flight-airline">
          ${f.airlineLogo
            ? `<img src="${f.airlineLogo}" alt="${f.airlineName}" class="flight-airline-img" width="36" height="36" />`
            : getAirlineLogo(f.airline)}
          <span class="flight-airline-name">${f.airlineName}</span>
        </div>
        <div class="flight-details">
          <div class="flight-time">
            <div class="time">${f.departureTime}</div>
            <div class="airport">${f.origin}</div>
            <div class="city">${f.originCity}</div>
          </div>
          <div class="flight-route">
            <div class="flight-duration">${formatDuration(f.duration)}</div>
            <div class="flight-route-line"></div>
            <div class="flight-stops">${stopsLabel}${f.connectionAirport ? ` · ${f.connectionAirport}` : ''}</div>
          </div>
          <div class="flight-time">
            <div class="time">${f.arrivalTime}${f.nextDay ? '+1' : ''}</div>
            <div class="airport">${f.destination}</div>
            <div class="city">${f.destinationCity}</div>
          </div>
        </div>
        <div class="flight-price">
          <div class="flight-price-label">Por pessoa a partir de</div>
          <div class="flight-price-value">${formatCurrency(f.pricePerPerson)}</div>
          <div class="flight-price-sub">Inclui taxas e impostos</div>
          ${f.sourceLabel ? `<div class="flight-source-label">Fonte: ${f.sourceLabel}</div>` : ''}
          ${f.verifyUrl ? `<a href="${f.verifyUrl}" target="_blank" rel="noopener noreferrer" class="flight-verify-link" onclick="event.stopPropagation()">Verificar preço ↗</a>` : ''}
          ${f.airlineUrl ? `<a href="${f.airlineUrl}" target="_blank" rel="noopener noreferrer" class="flight-airline-link" onclick="event.stopPropagation()">Site ${f.airlineName} ↗</a>` : ''}
          <button class="flight-select-btn" data-select="${f.id}">Selecionar</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-select]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const flight = filteredFlights.find(f => f.id === btn.dataset.select);
      if (flight) showBookingModal(flight);
    });
  });
}

function showBookingModal(flight) {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>Confirmar reserva</h2>
          <button class="btn btn-ghost btn-icon" id="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px;background:var(--gray-50);border-radius:12px">
            ${getAirlineLogo(flight.airline)}
            <div>
              <strong>${flight.origin} → ${flight.destination}</strong><br>
              <small>${flight.departureTime} · ${formatDuration(flight.duration)} · ${formatCurrency(flight.pricePerPerson)}/pax</small>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Nome do passageiro</label>
            <input type="text" id="passenger-name" placeholder="Nome completo" />
          </div>
          <div class="form-group">
            <label class="form-label">Valor da reserva (R$)</label>
            <input type="number" id="res-value" value="${flight.pricePerPerson}" />
          </div>
          ${flight.verifyUrl || flight.airlineUrl ? `
            <div class="booking-verify-box">
              <p><strong>Confirme o preço antes de reservar:</strong></p>
              ${flight.verifyUrl ? `<a href="${flight.verifyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Google Flights ↗</a>` : ''}
              ${flight.airlineUrl ? `<a href="${flight.airlineUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Site ${flight.airlineName} ↗</a>` : ''}
            </div>
          ` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="modal-confirm">Confirmar reserva</button>
        </div>
      </div>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };

  document.getElementById('modal-close')?.addEventListener('click', close);
  document.getElementById('modal-cancel')?.addEventListener('click', close);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') close();
  });

  document.getElementById('modal-confirm')?.addEventListener('click', () => {
    const name = document.getElementById('passenger-name')?.value.trim();
    if (!name) {
      document.getElementById('passenger-name')?.focus();
      return;
    }

    const value = parseFloat(document.getElementById('res-value')?.value) || flight.pricePerPerson;
    const locator = generateLocator();
    const departDateTime = `${flight.departDate}T${flight.departureTime}:00`;

    const reservation = store.addReservation({
      locator,
      airline: flight.airline,
      dataSource,
      verifyUrl: flight.verifyUrl || verifyUrl,
      sourceLabel: flight.sourceLabel || (dataSource === 'serpapi' ? 'Google Flights' : dataSource),
      searchedAt,
      passengers: [{ name, ticketId: generateTicketNumber(name, locator) }],
      outbound: {
        origin: flight.origin,
        destination: flight.destination,
        status: 'Confirmado',
        date: departDateTime,
        flightNumber: flight.flightNumber || `${flight.airline}${String(flight.id).slice(-2)}`,
        duration: flight.duration,
        arrivalTime: flight.arrivalTime,
        nextDay: flight.nextDay,
        stops: flight.stops,
      },
      inbound: searchParams.returnDate ? {
        origin: flight.destination,
        destination: flight.origin,
        status: 'Confirmado',
        date: `${searchParams.returnDate}T${flight.departureTime}:00`,
      } : null,
      description: '',
      value,
      status: 'Confirmado',
    });

    close();
    router.navigate('/reserva', { id: reservation.id });
  });
}

function formatSearchedAt(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso.replace(' UTC', 'Z'));
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

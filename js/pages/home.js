import { router } from '../router.js';
import { store } from '../store.js';
import { searchAirports, getAirport } from '../data/airports.js';
import { airlines } from '../data/airlines.js';
import { formatDateRange, formatMonthYear, debounce } from '../utils/formatters.js';

let state = {
  tripType: 'roundtrip',
  origin: 'GRU',
  destination: 'JFK',
  departDate: '',
  returnDate: '',
  passengers: 1,
};

export function renderHome() {
  const main = document.getElementById('main-content');
  const recentSearches = store.getRecentSearches();
  const originAirport = getAirport(state.origin);
  const destAirport = getAirport(state.destination);

  const today = new Date();
  const defaultDepart = new Date(today);
  defaultDepart.setDate(defaultDepart.getDate() + 14);
  const defaultReturn = new Date(defaultDepart);
  defaultReturn.setDate(defaultReturn.getDate() + 7);
  if (!state.departDate) state.departDate = defaultDepart.toISOString().split('T')[0];
  if (!state.returnDate) state.returnDate = defaultReturn.toISOString().split('T')[0];

  main.innerHTML = `
    <section class="hero">
      <div class="container hero-content">
        <div class="hero-top">
          <div class="toggle-group hero-trip-type" id="trip-type-toggle">
            <button class="toggle-btn ${state.tripType === 'roundtrip' ? 'active' : ''}" data-type="roundtrip">Ida e volta</button>
            <button class="toggle-btn ${state.tripType === 'oneway' ? 'active' : ''}" data-type="oneway">Só ida</button>
          </div>
          <div class="hero-prices">
            <div class="hero-price-tag smiles">🟠 R$ 17,00</div>
            <div class="hero-price-tag livelo">🔵 R$ 15,00</div>
          </div>
        </div>

        <div class="search-form-container" id="search-form">
          <div class="search-field" style="position:relative">
            <label class="search-field-label">Origem</label>
            <div class="search-field-input">
              <span class="icon">📍</span>
              <input type="text" id="origin-input" value="${originAirport ? `${originAirport.city} (${originAirport.code})` : state.origin}" autocomplete="off" />
            </div>
            <div class="autocomplete-dropdown" id="origin-dropdown"></div>
          </div>

          <div class="search-field-divider"></div>

          <div class="search-field" style="position:relative">
            <label class="search-field-label">Destino</label>
            <div class="search-field-input">
              <span class="icon">📍</span>
              <input type="text" id="dest-input" value="${destAirport ? `${destAirport.city} (${destAirport.code})` : state.destination}" autocomplete="off" />
            </div>
            <div class="autocomplete-dropdown" id="dest-dropdown"></div>
          </div>

          <div class="search-field-divider"></div>

          <div class="search-field">
            <label class="search-field-label">Datas</label>
            <div class="search-field-input">
              <span class="icon">📅</span>
              <input type="date" id="depart-date" value="${state.departDate}" />
              ${state.tripType === 'roundtrip' ? `<input type="date" id="return-date" value="${state.returnDate}" style="margin-left:8px" />` : ''}
            </div>
          </div>

          <div class="search-field-divider"></div>

          <div class="search-field">
            <label class="search-field-label">Passageiros</label>
            <div class="search-field-input">
              <span class="icon">👤</span>
              <select id="passengers-select">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}" ${n === state.passengers ? 'selected' : ''}>${n} adulto${n > 1 ? 's' : ''}</option>`).join('')}
              </select>
            </div>
          </div>

          <button class="search-btn" id="search-btn">🔍 Buscar voos</button>
        </div>
      </div>
    </section>

    ${recentSearches.length ? `
    <section class="recent-searches">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Pesquisas recentes</h2>
          <span class="section-link" id="clear-recent">Limpar tudo</span>
        </div>
        <div class="recent-cards">
          ${recentSearches.map(s => {
            const o = getAirport(s.origin);
            const d = getAirport(s.destination);
            return `
              <div class="recent-card" data-search='${JSON.stringify(s)}'>
                <div class="recent-card-img"></div>
                <div class="recent-card-badges">
                  <span class="recent-card-badge">${s.tripType === 'roundtrip' ? 'Ida e volta' : 'Só ida'}</span>
                  <span class="recent-card-badge">${s.passengers} Pax</span>
                </div>
                <div class="recent-card-info">
                  <h3>${d?.city || s.destination}</h3>
                  <p>${o?.city || s.origin}</p>
                  <p class="date">${formatDateRange(s.departDate, s.returnDate)}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <section class="airlines-section">
      <div class="container">
        <div class="airlines-header">
          <h2>Viaje com as principais companhias aéreas do mundo.</h2>
          <p>Emitimos passagens com milhas em diversas companhias nacionais e internacionais.</p>
        </div>
        <div class="airlines-logos">
          ${airlines.slice(0, 7).map(a => `
            <div class="airline-logo">
              <div class="res-airline-icon" style="background:${a.color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold">${a.code}</div>
              <span class="airline-logo-text" style="color:${a.color}">${a.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <div class="features-previews">
          <div class="feature-preview">
            <div class="feature-preview-img"><div class="mock-ui">🔍 Busca de voos em tempo real</div></div>
            <div class="feature-preview-body">
              <h3>Compare preços</h3>
              <p>Encontre as melhores tarifas entre LATAM, Azul, GOL, TAP e outras companhias.</p>
            </div>
          </div>
          <div class="feature-preview">
            <div class="feature-preview-img"><div class="mock-ui">📋 Gestão de reservas</div></div>
            <div class="feature-preview-body">
              <h3>Gerencie reservas</h3>
              <p>Controle todas as suas reservas em um painel centralizado.</p>
            </div>
          </div>
          <div class="feature-preview">
            <div class="feature-preview-img"><div class="mock-ui">📄 PDF automático</div></div>
            <div class="feature-preview-body">
              <h3>Gere comprovantes</h3>
              <p>Exporte PDFs de reserva para seus clientes com um clique.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="reviews-section">
      <div class="container">
        <div class="reviews-header">
          <div class="reviews-header-left">
            <span class="reviews-label">Avaliações</span>
            <h2 class="reviews-title">O que dizem nossos clientes</h2>
          </div>
          <div class="reviews-score">
            <div class="stars">★★★★★</div>
            <div class="score">4.9</div>
          </div>
        </div>
        <div class="reviews-grid">
          ${[
            { name: 'Carlos M.', text: 'Excelente plataforma para emitir passagens com milhas. Processo rápido e confiável.' },
            { name: 'Ana P.', text: 'Consegui emitir passagens internacionais com ótimas tarifas. Recomendo!' },
            { name: 'Roberto S.', text: 'O painel de agência facilita muito o controle das reservas dos meus clientes.' },
            { name: 'Juliana L.', text: 'Atendimento impecável e preços competitivos. Uso sempre para minhas viagens.' },
          ].map(r => `
            <div class="review-card">
              <div class="stars">★★★★★</div>
              <p>${r.text}</p>
              <div class="review-author">
                <div class="review-avatar">${r.name[0]}</div>
                <div class="review-author-info">
                  <span class="review-author-name">${r.name}</span>
                  <span class="review-author-time">há 2 semanas</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('trip-type-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    state.tripType = btn.dataset.type;
    renderHome();
  });

  setupAutocomplete('origin-input', 'origin-dropdown', code => { state.origin = code; });
  setupAutocomplete('dest-input', 'dest-dropdown', code => { state.destination = code; });

  document.getElementById('passengers-select')?.addEventListener('change', e => {
    state.passengers = parseInt(e.target.value);
  });

  document.getElementById('depart-date')?.addEventListener('change', e => {
    state.departDate = e.target.value;
  });

  document.getElementById('return-date')?.addEventListener('change', e => {
    state.returnDate = e.target.value;
  });

  document.getElementById('search-btn')?.addEventListener('click', doSearch);

  document.getElementById('clear-recent')?.addEventListener('click', () => {
    store.clearRecentSearches();
    renderHome();
  });

  document.querySelectorAll('.recent-card').forEach(card => {
    card.addEventListener('click', () => {
      const s = JSON.parse(card.dataset.search);
      router.navigate('/buscar', s);
    });
  });
}

function setupAutocomplete(inputId, dropdownId, onSelect) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  const showResults = debounce(query => {
    const results = searchAirports(query);
    if (!results.length) {
      dropdown.innerHTML = '';
      dropdown.style.display = 'none';
      return;
    }
    dropdown.innerHTML = results.map(a => `
      <div class="autocomplete-item" data-code="${a.code}">
        <strong>${a.city}</strong> (${a.code})<br>
        <small>${a.name}</small>
      </div>
    `).join('');
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        const airport = getAirport(item.dataset.code);
        input.value = `${airport.city} (${airport.code})`;
        onSelect(airport.code);
        dropdown.style.display = 'none';
      });
    });
  }, 200);

  input.addEventListener('input', () => showResults(input.value));
  input.addEventListener('focus', () => showResults(input.value));
  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function doSearch() {
  const search = {
    origin: state.origin,
    destination: state.destination,
    departDate: state.departDate,
    returnDate: state.tripType === 'roundtrip' ? state.returnDate : null,
    passengers: state.passengers,
    tripType: state.tripType,
  };
  store.addRecentSearch(search);
  router.navigate('/buscar', search);
}

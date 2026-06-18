import { router } from '../router.js';
import { store } from '../store.js';
import { airlines, getAirline, getAirlineLogo } from '../data/airlines.js';
import { searchAirports, getAirport } from '../data/airports.js';
import { generateLocator, generateTicketNumber } from '../utils/formatters.js';

export function showAddReservationModal(onSaved) {
  const modalRoot = document.getElementById('modal-root');
  let selectedAirline = 'AD';

  function renderModal() {
    const airline = getAirline(selectedAirline);
    modalRoot.innerHTML = `
      <div class="modal-overlay" id="add-res-overlay">
        <div class="modal add-res-modal">
          <div class="modal-header">
            <h2>Reserva ${airline.name}</h2>
            <button class="btn btn-ghost btn-icon" id="add-res-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="airline-selected">
              ${getAirlineLogo(selectedAirline)}
              <div>
                <strong>${airline.name}</strong>
                <small>Companhia selecionada</small>
              </div>
              <button class="link-btn" id="add-res-change-airline">Trocar</button>
            </div>

            <div class="form-group">
              <label class="form-label">Localizador</label>
              <div class="input-with-action">
                <input type="text" id="manual-locator" placeholder="EX: UJQFGP" maxlength="6" style="text-transform:uppercase" />
                <button type="button" class="btn btn-ghost btn-sm" id="manual-paste">📋 Colar</button>
              </div>
            </div>

            <div class="form-group" style="position:relative">
              <label class="form-label">Aeroporto de origem</label>
              <input type="text" id="manual-origin" placeholder="Buscar aeroporto" autocomplete="off" />
              <div class="autocomplete-dropdown" id="manual-origin-dropdown"></div>
            </div>

            <div class="form-group">
              <label class="form-label">Nome do passageiro</label>
              <input type="text" id="manual-passenger" placeholder="Nome completo" />
            </div>

            <div class="form-check">
              <input type="checkbox" id="manual-notify" checked />
              <label for="manual-notify">
                <strong>Notificar alterações na reserva</strong>
                <small>Check-in, mudança de voo e status.</small>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="add-res-cancel">Voltar</button>
            <button class="btn btn-primary" id="add-res-save">Adicionar reserva</button>
          </div>
        </div>
      </div>
    `;

    bindModalEvents();
  }

  function bindModalEvents() {
    const close = () => { modalRoot.innerHTML = ''; };

    document.getElementById('add-res-close')?.addEventListener('click', close);
    document.getElementById('add-res-cancel')?.addEventListener('click', close);
    document.getElementById('add-res-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'add-res-overlay') close();
    });

    document.getElementById('add-res-change-airline')?.addEventListener('click', () => {
      const codes = airlines.slice(0, 6).map(a => a.code);
      const idx = codes.indexOf(selectedAirline);
      selectedAirline = codes[(idx + 1) % codes.length];
      renderModal();
    });

    document.getElementById('manual-paste')?.addEventListener('click', async () => {
      try {
        const t = await navigator.clipboard.readText();
        document.getElementById('manual-locator').value = t.trim().toUpperCase().slice(0, 6);
      } catch { /* ignore */ }
    });

    let originCode = 'GRU';
    const originInput = document.getElementById('manual-origin');
    const dropdown = document.getElementById('manual-origin-dropdown');

    originInput?.addEventListener('input', () => {
      const results = searchAirports(originInput.value);
      if (!results.length) { dropdown.style.display = 'none'; return; }
      dropdown.innerHTML = results.map(a => `
        <div class="autocomplete-item" data-code="${a.code}">${a.city} (${a.code})</div>
      `).join('');
      dropdown.style.display = 'block';
      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          originCode = item.dataset.code;
          originInput.value = `${getAirport(originCode).city} (${originCode})`;
          dropdown.style.display = 'none';
        });
      });
    });

    document.getElementById('add-res-save')?.addEventListener('click', () => {
      const locator = document.getElementById('manual-locator')?.value.trim().toUpperCase();
      const name = document.getElementById('manual-passenger')?.value.trim();
      if (!locator || locator.length < 5) { alert('Informe o localizador.'); return; }
      if (!name) { alert('Informe o nome do passageiro.'); return; }

      const reservation = store.addReservation({
        locator,
        airline: selectedAirline,
        passengers: [{ name, ticketId: generateTicketNumber(name, locator) }],
        outbound: {
          origin: originCode,
          destination: 'GIG',
          status: 'Confirmado',
          date: new Date().toISOString().slice(0, 16),
        },
        inbound: null,
        description: '',
        value: 0,
        status: 'Confirmado',
        dataSource: 'manual',
      });

      close();
      onSaved?.(reservation);
    });
  }

  renderModal();
}

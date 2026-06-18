import { router } from '../router.js';
import { store } from '../store.js';
import { getAirline, normalizeAirlineCode } from '../data/airlines.js';
import { buildReservationCardHTML, HEADER_COLORS } from '../utils/reservation-card.js';
import { generateReservationPDF } from '../utils/pdf-generator.js';

let headerColor = null;

export function renderReservationDetail(params = {}) {
  const main = document.getElementById('main-content');
  const reservation = store.getReservation(params.id);

  if (!reservation) {
    main.innerHTML = `
      <div class="container" style="padding:60px 0;text-align:center">
        <h2>Reserva não encontrada</h2>
        <button class="btn btn-primary" style="margin-top:16px" id="back-agency">Voltar para agência</button>
      </div>
    `;
    document.getElementById('back-agency')?.addEventListener('click', () => router.navigate('/minha-agencia'));
    return;
  }

  const airline = getAirline(normalizeAirlineCode(reservation.airline));
  if (!headerColor) headerColor = airline.color;

  main.innerHTML = `
    <div class="reservation-detail-page">
      <div class="container">
        <div class="res-detail-actions">
          <button class="btn btn-ghost btn-sm" id="back-btn">← Voltar</button>
        </div>

        <div id="res-card-preview">
          ${buildReservationCardHTML(reservation, { headerColor })}
        </div>

        <div class="res-detail-toolbar">
          <button class="btn btn-primary" id="pdf-btn">⬇ Salvar PDF</button>
          ${reservation.verifyUrl ? `
            <a href="${reservation.verifyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
              Verificar no Google Flights ↗
            </a>
          ` : ''}

          <div class="toolbar-group">
            <span class="toolbar-label">Cor</span>
            <div class="color-picker" id="color-picker">
              ${HEADER_COLORS.map(c => `
                <button class="color-swatch ${headerColor === c.value ? 'active' : ''}"
                        data-color="${c.value}" title="${c.label}"
                        style="background:${c.value}"></button>
              `).join('')}
            </div>
          </div>

          <div class="toolbar-group">
            <span class="toolbar-label">🌐 PT-BR</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-btn')?.addEventListener('click', () => router.navigate('/minha-agencia'));

  document.getElementById('pdf-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('pdf-btn');
    btn.disabled = true;
    btn.textContent = 'Gerando PDF...';
    try {
      await generateReservationPDF(reservation, { headerColor });
    } finally {
      btn.disabled = false;
      btn.textContent = '⬇ Salvar PDF';
    }
  });

  document.getElementById('color-picker')?.addEventListener('click', e => {
    const swatch = e.target.closest('[data-color]');
    if (!swatch) return;
    headerColor = swatch.dataset.color;
    document.getElementById('res-card-preview').innerHTML =
      buildReservationCardHTML(reservation, { headerColor });
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
  });
}

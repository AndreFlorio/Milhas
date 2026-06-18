import { router } from '../router.js';
import { store } from '../store.js';
import { airlines, getAirline, getAirlineLogo } from '../data/airlines.js';
import { lookupReservation } from '../services/reservation-lookup.js';
import { lookupResultToReservation } from '../utils/reservation-import.js';
import { formatDateTime } from '../utils/formatters.js';

let lookupResult = null;
let form = { airline: 'TP', locator: '', lastName: '', showPicker: false };

export function renderManageReservation() {
  const main = document.getElementById('main-content');
  const airline = getAirline(form.airline);

  main.innerHTML = `
    <div class="manage-res-page">
      <div class="container">
        <div class="manage-res-header">
          <button class="btn btn-ghost btn-sm" id="back-agency">← Minha agência</button>
          <h1>Gerenciar Reserva</h1>
          <p>Consulte dados reais no site da companhia usando localizador + sobrenome</p>
        </div>

        <div class="manage-res-layout">
          <div class="manage-res-form-card card">
            <h2>Consultar reserva</h2>

            <div class="airline-selected" id="airline-selected">
              ${getAirlineLogo(form.airline)}
              <div>
                <strong>${airline.fullName || airline.name}</strong>
                <small>Companhia selecionada</small>
              </div>
              <button class="link-btn" id="toggle-airlines">Trocar</button>
            </div>

            <div class="airline-picker ${form.showPicker ? '' : 'hidden'}" id="airline-picker">
              ${airlines.filter(a => ['TP', 'AD', 'LA', 'G3'].includes(a.code)).map(a => `
                <button class="airline-pick-btn ${form.airline === a.code ? 'active' : ''}" data-airline="${a.code}">
                  ${getAirlineLogo(a.code)} ${a.name}
                  ${a.code === 'TP' ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Em breve</span>'}
                </button>
              `).join('')}
            </div>

            <div class="form-group">
              <label class="form-label">Localizador</label>
              <div class="input-with-action">
                <input type="text" id="locator-input" placeholder="EX: ZN48VF" value="${form.locator}" maxlength="6" style="text-transform:uppercase" />
                <button type="button" class="btn btn-ghost btn-sm" id="paste-locator">📋 Colar</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Sobrenome do passageiro</label>
              <input type="text" id="lastname-input" placeholder="EX: ROCHADONASCIMENTO" value="${form.lastName}" style="text-transform:uppercase" />
              <small class="field-hint">Use só o sobrenome como no bilhete (sem acentos). Nome completo também funciona.</small>
            </div>

            <div class="form-check">
              <input type="checkbox" id="notify-changes" checked />
              <label for="notify-changes">
                <strong>Notificar alterações na reserva</strong>
                <small>Check-in disponível, mudança de voo, status e atualizações da cia aérea.</small>
              </label>
            </div>

            <button class="btn btn-primary btn-lg" id="search-btn" style="width:100%">
              🔍 Buscar Reserva
            </button>

            <p class="manage-res-note">
              TAP: consulta via check-in oficial Amadeus. Outras companhias em breve.
            </p>
          </div>

          <div class="manage-res-result" id="result-panel">
            ${lookupResult ? renderResult(lookupResult) : renderEmpty()}
          </div>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function renderEmpty() {
  return `
    <div class="result-empty card card-elevated">
      <div class="result-empty-icon">🎫</div>
      <h3>Resultado da consulta</h3>
      <p>Preencha localizador e sobrenome para buscar dados reais da companhia aérea.</p>
      <ul class="result-checklist">
        <li>✓ Passageiro e bilhete</li>
        <li>✓ Voos e horários</li>
        <li>✓ Bagagens</li>
        <li>✓ Check-in e assento</li>
        <li>✓ Contato (quando disponível)</li>
      </ul>
    </div>
  `;
}

function renderResult(data) {
  const p = data.passengers?.[0] || {};
  return `
    <div class="result-card card card-elevated">
      <div class="result-card-header">
        <span class="badge badge-green">${data.status || 'Confirmado'}</span>
        <span class="result-source">${data.sourceLabel || 'Fonte oficial'}</span>
      </div>

      <div class="result-locator-row">
        <span class="result-locator">${data.locator}</span>
        ${data.verifyUrl ? `<a href="${data.verifyUrl}" target="_blank" rel="noopener" class="source-link">Ver no site da cia ↗</a>` : ''}
      </div>

      <div class="result-section">
        <h4>PASSAGEIRO</h4>
        <div class="result-grid">
          <div><label>Nome</label><strong>${p.name || '—'}</strong></div>
          <div><label>Bilhete</label><strong>${p.ticketNumber || '—'}</strong></div>
          <div><label>Assento</label><strong>${p.seat || '—'}</strong></div>
          <div><label>Check-in</label><strong>${p.checkinStatus || '—'}</strong></div>
          ${p.email ? `<div><label>Email</label><strong>${p.email}</strong></div>` : ''}
          ${p.phone ? `<div><label>Telefone</label><strong>${p.phone}</strong></div>` : ''}
        </div>
      </div>

      ${data.outbound ? `
        <div class="result-section">
          <h4>VOO DE IDA</h4>
          <div class="result-flight">
            <strong>${data.outbound.origin} → ${data.outbound.destination}</strong>
            <span>${data.outbound.flightNumber || ''}</span>
            <span>${formatDateTime(data.outbound.date)}</span>
            <span class="badge badge-${data.outbound.status === 'Fechado' ? 'amber' : 'green'}">${data.outbound.status}</span>
          </div>
        </div>
      ` : ''}

      ${data.inbound ? `
        <div class="result-section">
          <h4>VOO DE VOLTA</h4>
          <div class="result-flight">
            <strong>${data.inbound.origin} → ${data.inbound.destination}</strong>
            <span>${data.inbound.flightNumber || ''}</span>
            <span>${formatDateTime(data.inbound.date)}</span>
          </div>
        </div>
      ` : ''}

      ${data.baggage?.length ? `
        <div class="result-section">
          <h4>BAGAGENS</h4>
          <div class="baggage-mini-grid">
            ${data.baggage.map(b => `
              <div class="baggage-mini-item">
                <span>${b.label}</span>
                <strong>${b.count}× ${b.weight}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="result-actions">
        <button class="btn btn-primary btn-lg" id="import-btn">↓ Importar para Minhas Reservas</button>
        <button class="btn btn-secondary" id="new-search-btn">Nova consulta</button>
      </div>
    </div>
  `;
}

function bindEvents() {
  document.getElementById('back-agency')?.addEventListener('click', () => router.navigate('/minha-agencia'));

  document.getElementById('toggle-airlines')?.addEventListener('click', () => {
    form.showPicker = !form.showPicker;
    document.getElementById('airline-picker')?.classList.toggle('hidden');
  });

  document.getElementById('airline-picker')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-airline]');
    if (!btn) return;
    form.airline = btn.dataset.airline;
    renderManageReservation();
  });

  document.getElementById('paste-locator')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      form.locator = text.trim().toUpperCase().slice(0, 6);
      document.getElementById('locator-input').value = form.locator;
    } catch {
      alert('Não foi possível colar da área de transferência.');
    }
  });

  document.getElementById('search-btn')?.addEventListener('click', doSearch);

  document.getElementById('import-btn')?.addEventListener('click', () => {
    if (!lookupResult) return;
    const reservation = lookupResultToReservation(lookupResult);
    store.upsertReservation(reservation);
    alert(`Reserva ${reservation.locator} importada com sucesso!`);
    router.navigate('/minha-agencia');
  });

  document.getElementById('new-search-btn')?.addEventListener('click', () => {
    lookupResult = null;
    renderManageReservation();
  });
}

async function doSearch() {
  form.locator = document.getElementById('locator-input')?.value.trim().toUpperCase() || '';
  form.lastName = document.getElementById('lastname-input')?.value.trim().toUpperCase() || '';

  if (!form.locator || form.locator.length < 5) {
    alert('Informe um localizador válido (6 caracteres).');
    return;
  }
  if (!form.lastName || form.lastName.length < 2) {
    alert('Informe o sobrenome do passageiro.');
    return;
  }

  if (form.airline !== 'TP') {
    alert('Consulta automática disponível apenas para TAP no momento. Use "+ Adicionar" para cadastro manual.');
    return;
  }

  const btn = document.getElementById('search-btn');
  const panel = document.getElementById('result-panel');
  btn.disabled = true;
  btn.textContent = 'Consultando site da TAP...';
  panel.innerHTML = `<div class="result-loading card"><div class="loading-spinner"></div><p>Buscando no check-in oficial TAP...</p><small>Isso pode levar até 30 segundos</small></div>`;

  try {
    lookupResult = await lookupReservation({
      airline: form.airline,
      locator: form.locator,
      lastName: form.lastName,
    });
    panel.innerHTML = renderResult(lookupResult);
    document.getElementById('import-btn')?.addEventListener('click', () => {
      const reservation = lookupResultToReservation(lookupResult);
      store.upsertReservation(reservation);
      alert(`Reserva ${reservation.locator} importada!`);
      router.navigate('/minha-agencia');
    });
    document.getElementById('new-search-btn')?.addEventListener('click', () => {
      lookupResult = null;
      renderManageReservation();
    });
  } catch (err) {
    panel.innerHTML = `
      <div class="result-error card">
        <h3>Não foi possível consultar</h3>
        <p>${err.message}</p>
        <p class="manage-res-note">Dica: use o localizador exato e o sobrenome como aparece no bilhete (sem acentos).</p>
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.textContent = '🔍 Buscar Reserva';
  }
}

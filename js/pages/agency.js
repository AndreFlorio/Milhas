import { router } from '../router.js';
import { store } from '../store.js';
import { getAirline, getAirlineSmallLogo } from '../data/airlines.js';
import { getAirport } from '../data/airports.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';
import { generateReservationPDF } from '../utils/pdf-generator.js';
import { showAddReservationModal } from '../components/add-reservation-modal.js';

let activeTab = 'all';
let searchQuery = '';

export function renderAgency() {
  const main = document.getElementById('main-content');
  const reservations = store.getReservations();
  const stats = computeStats(reservations);
  const tabCounts = computeTabCounts(reservations);
  const filtered = filterReservations(reservations);

  main.innerHTML = `
    <div class="reservations-page">
      <div class="container">
        <div class="stats-row">
          <div class="res-stat-card">
            <div class="res-stat-header"><span class="res-stat-icon">📋</span><span class="res-stat-label">Reservas</span></div>
            <div class="res-stat-value">${stats.total}</div>
            <div class="res-stat-sub">emitidas no sistema</div>
            <div class="res-stat-filters">
              <span class="res-stat-filter active">Todas</span>
              <span class="res-stat-filter">Confirmadas</span>
              <span class="res-stat-filter">Canceladas</span>
            </div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-header"><span class="res-stat-icon">✈</span><span class="res-stat-label">Voos a embarcar</span></div>
            <div class="res-stat-value">${stats.upcoming}</div>
            <div class="res-stat-sub">próximos voos</div>
            <div class="res-stat-filters">
              <span class="res-stat-filter">Todos</span>
              <span class="res-stat-filter">Hoje</span>
              <span class="res-stat-filter">7 dias</span>
              <span class="res-stat-filter">Este mês</span>
            </div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-header"><span class="res-stat-icon">🎫</span><span class="res-stat-label">Check-ins abertos</span></div>
            <div class="res-stat-value">${stats.checkin}</div>
            <div class="res-stat-sub">requerem ação</div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-header"><span class="res-stat-icon">🔄</span><span class="res-stat-label">Reservas alteradas</span></div>
            <div class="res-stat-value">${stats.changed}</div>
            <div class="res-stat-sub">não revisadas</div>
          </div>
        </div>

        <div class="res-filter-tabs" id="res-tabs">
          ${[
            { id: 'all', label: 'Todos', count: tabCounts.all },
            { id: 'upcoming', label: 'Próximos voos', count: tabCounts.upcoming },
            { id: 'completed', label: 'Concluídas', count: tabCounts.completed },
            { id: 'cancelled', label: 'Canceladas', count: tabCounts.cancelled },
          ].map(t => `
            <button class="res-filter-tab ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
              ${t.label} <span class="count">${t.count}</span>
            </button>
          `).join('')}
        </div>

        <div class="res-actions-bar">
          <div class="res-search">
            <span class="search-icon">🔍</span>
            <input type="text" id="res-search-input" placeholder="Localizador, passageiro, descrição..." value="${searchQuery}" />
          </div>
          <button class="btn btn-secondary btn-sm" id="manage-res-btn">🔍 Gerenciar reserva</button>
          <button class="btn btn-primary btn-sm" id="add-res-btn">+ Adicionar</button>
        </div>

        <div class="res-table-container">
          <table class="res-table">
            <thead>
              <tr>
                <th>CIA</th>
                <th>Localizador</th>
                <th>Passageiro(s)</th>
                <th>Ida</th>
                <th>Volta</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="res-tbody">
              ${filtered.length ? filtered.map(r => renderRow(r)).join('') : `
                <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-tertiary)">Nenhuma reserva encontrada</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  bindEvents(reservations);
}

function renderRow(r) {
  const airline = getAirline(r.airline);
  const extraPax = r.passengers.length > 1 ? `<span class="res-passenger-extra">+${r.passengers.length - 1}</span>` : '';

  return `
    <tr data-id="${r.id}">
      <td><div class="res-airline-cell">${getAirlineSmallLogo(r.airline)}</div></td>
      <td>
        <div class="res-locator">${r.locator}</div>
        <span class="badge badge-green">${r.status}</span>
      </td>
      <td>
        <div class="res-passengers">
          <span class="res-passenger-name">${r.passengers[0]?.name || '—'}</span>
          ${extraPax}
        </div>
      </td>
      <td>${renderFlightCell(r.outbound)}</td>
      <td>${r.inbound ? renderFlightCell(r.inbound) : '<span style="color:var(--text-tertiary)">—</span>'}</td>
      <td>
        <span class="res-description" data-edit-desc="${r.id}">${r.description || 'Adicionar descrição...'}</span>
      </td>
      <td><span class="res-value">${formatCurrency(r.value || 0)}</span></td>
      <td>
        <div class="res-actions">
          <button class="res-action-btn" data-action="copy" data-id="${r.id}" title="Copiar">📋</button>
          <button class="res-action-btn" data-action="view" data-id="${r.id}" title="Ver">🔗</button>
          <button class="res-action-btn" data-action="pdf" data-id="${r.id}" title="PDF">📄</button>
          <button class="res-action-btn delete" data-action="delete" data-id="${r.id}" title="Excluir">🗑</button>
        </div>
      </td>
    </tr>
  `;
}

function renderFlightCell(flight) {
  if (!flight) return '—';
  return `
    <div class="res-flight-info">
      <div class="res-flight-route">
        ${flight.origin} → ${flight.destination}
        <span class="res-flight-status ${flight.status === 'Fechado' ? 'fechado' : 'confirmado'}">${flight.status}</span>
      </div>
      <div class="res-flight-date">📅 ${formatDateTime(flight.date)}</div>
    </div>
  `;
}

function computeStats(reservations) {
  const now = new Date();
  return {
    total: reservations.length,
    upcoming: reservations.filter(r => r.outbound && new Date(r.outbound.date) > now).length,
    checkin: 0,
    changed: reservations.filter(r => r.status === 'Alterada').length,
  };
}

function computeTabCounts(reservations) {
  const now = new Date();
  return {
    all: reservations.length,
    upcoming: reservations.filter(r => r.outbound && new Date(r.outbound.date) > now).length,
    completed: reservations.filter(r => r.outbound && new Date(r.outbound.date) < now).length,
    cancelled: reservations.filter(r => r.status === 'Cancelada').length,
  };
}

function filterReservations(reservations) {
  const now = new Date();
  let list = [...reservations];

  if (activeTab === 'upcoming') list = list.filter(r => r.outbound && new Date(r.outbound.date) > now);
  else if (activeTab === 'completed') list = list.filter(r => r.outbound && new Date(r.outbound.date) < now);
  else if (activeTab === 'cancelled') list = list.filter(r => r.status === 'Cancelada');

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(r =>
      r.locator.toLowerCase().includes(q) ||
      r.passengers.some(p => p.name.toLowerCase().includes(q)) ||
      (r.description || '').toLowerCase().includes(q)
    );
  }

  return list;
}

function bindEvents(reservations) {
  document.getElementById('res-tabs')?.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    activeTab = tab.dataset.tab;
    renderAgency();
  });

  document.getElementById('res-search-input')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderAgency();
  });

  document.getElementById('manage-res-btn')?.addEventListener('click', () => {
    router.navigate('/gerenciar-reserva');
  });

  document.getElementById('add-res-btn')?.addEventListener('click', () => {
    showAddReservationModal(() => renderAgency());
  });

  document.getElementById('res-tbody')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      const id = btn.dataset.id;
      const res = store.getReservation(id);
      if (!res) return;

      switch (btn.dataset.action) {
        case 'copy':
          navigator.clipboard?.writeText(res.locator);
          break;
        case 'view':
          router.navigate('/reserva', { id });
          break;
        case 'pdf':
          generateReservationPDF(res).catch(() => alert('Erro ao gerar PDF'));
          break;
        case 'delete':
          if (confirm(`Excluir reserva ${res.locator}?`)) {
            store.deleteReservation(id);
            renderAgency();
          }
          break;
      }
      return;
    }

    const desc = e.target.closest('[data-edit-desc]');
    if (desc) {
      const id = desc.dataset.editDesc;
      const res = store.getReservation(id);
      const newDesc = prompt('Descrição da reserva:', res.description || '');
      if (newDesc !== null) {
        store.updateReservation(id, { description: newDesc });
        renderAgency();
      }
    }
  });
}

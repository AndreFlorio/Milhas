import { getAirline, normalizeAirlineCode } from '../data/airlines.js';
import { getAirport } from '../data/airports.js';
import { formatDuration } from '../data/flights.js';
import { generateTicketNumber } from './formatters.js';

const DAY_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTH_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const DEFAULT_BAGGAGE = [
  { label: 'Item pessoal', weight: '10kg', count: 0 },
  { label: 'Mala de mão', weight: '10kg', count: 1 },
  { label: 'Despachada', weight: '23kg', count: 0 },
  { label: 'Especial', weight: '45kg', count: 0 },
];

export const HEADER_COLORS = [
  { id: 'navy', label: 'Azul marinho', value: '#002147' },
  { id: 'tap', label: 'TAP', value: '#00A651' },
  { id: 'latam', label: 'LATAM', value: '#1B1464' },
  { id: 'azul', label: 'Azul', value: '#2B3990' },
  { id: 'gol', label: 'GOL', value: '#FF6600' },
];

export function getReservationCardModel(reservation, options = {}) {
  const airlineCode = normalizeAirlineCode(reservation.airline);
  const airline = getAirline(airlineCode);
  const headerColor = options.headerColor || airline.color || '#002147';
  const outbound = reservation.outbound;
  const inbound = reservation.inbound;
  const depDate = outbound?.date ? new Date(outbound.date) : null;

  let arrTime = outbound?.arrivalTime || '';
  if (!arrTime && depDate && outbound?.duration) {
    const arr = new Date(depDate.getTime() + outbound.duration * 60000);
    arrTime = arr.toTimeString().slice(0, 5);
  }

  const depTime = depDate ? depDate.toTimeString().slice(0, 5) : '';
  const dateLabel = depDate
    ? `${DAY_NAMES[depDate.getDay()]}, ${depDate.getDate()} ${MONTH_NAMES[depDate.getMonth()]}. ${depDate.getFullYear()}`
    : '';

  const outOrigin = getAirport(outbound?.origin);
  const outDest = getAirport(outbound?.destination);
  const legs = inbound ? 2 : 1;
  const tripLabel = inbound ? 'Ida e volta' : 'Só ida';

  const passengers = reservation.passengers.map((p, i) => ({
    index: String(i + 1).padStart(2, '0'),
    name: p.name,
    ticketId: p.ticketId || generateTicketNumber(p.name, reservation.locator),
  }));

  const baggage = reservation.baggage || DEFAULT_BAGGAGE;
  const baggageCount = baggage.reduce((sum, b) => sum + b.count, 0) || 1;

  return {
    headerColor,
    airline,
    locator: reservation.locator,
    status: reservation.status || 'Confirmado',
    passengers,
    outbound: {
      dateLabel,
      depTime,
      arrTime,
      origin: outbound?.origin,
      originLabel: `${outbound?.origin} - ${outOrigin?.city || ''}`,
      destination: outbound?.destination,
      destLabel: `${outDest?.city || ''} - ${outbound?.destination}`,
      flightNumber: outbound?.flightNumber || `${airline.code}75`,
      duration: outbound?.duration ? formatDuration(outbound.duration) : '—',
      nextDay: outbound?.nextDay,
    },
    inbound: inbound ? {
      date: inbound.date,
      depTime: new Date(inbound.date).toTimeString().slice(0, 5),
      origin: inbound.origin,
      destination: inbound.destination,
    } : null,
    tripLabel,
    legs,
    baggage,
    baggageCount,
    dataSource: reservation.dataSource || 'local',
  };
}

export function buildReservationCardHTML(reservation, options = {}) {
  const model = getReservationCardModel(reservation, options);
  const width = options.forPdf ? 680 : 100;

  return `
    <div class="pdf-reservation-card" style="
      width:${width}%;
      max-width:680px;
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#fff;
      border-radius:20px;
      overflow:hidden;
      border:1px solid #e2e8f0;
      box-sizing:border-box;
    ">
      <div style="background:${model.headerColor};color:#fff;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;background:rgba(255,255,255,0.18);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;">${model.airline.code}</div>
          <div>
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;opacity:0.95;">${model.airline.fullName || model.airline.name}</div>
            <div style="font-size:12px;font-weight:600;letter-spacing:0.06em;margin-top:2px;">RESERVA CONFIRMADA</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;letter-spacing:0.1em;opacity:0.85;">LOCALIZADOR</div>
          <div style="font-size:22px;font-weight:800;font-family:'Courier New',monospace;letter-spacing:0.12em;">${model.locator}</div>
        </div>
      </div>

      <div style="padding:20px 24px;border-bottom:1px dashed #e2e8f0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
          <span style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.08em;">PASSAGEIROS</span>
          <span style="font-size:11px;color:#94a3b8;">${model.passengers.length} passageiro${model.passengers.length > 1 ? 's' : ''}</span>
        </div>
        ${model.passengers.map(p => `
          <div style="display:flex;align-items:center;gap:12px;background:#f8fafc;border-radius:12px;padding:12px 14px;margin-bottom:10px;">
            <span style="font-size:13px;font-weight:700;color:#94a3b8;min-width:24px;">${p.index}</span>
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:600;color:#0f172a;">${p.name}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${p.ticketId}</div>
            </div>
            <span style="color:#94a3b8;font-size:16px;">👁</span>
          </div>
        `).join('')}
        <div style="border:1px dashed #e2e8f0;border-radius:12px;padding:10px;text-align:center;font-size:13px;color:#64748b;">🐾 Adicionar pet</div>
      </div>

      <div style="padding:20px 24px;border-bottom:1px dashed #e2e8f0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
          <span style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.08em;">ITINERÁRIO</span>
          <span style="font-size:11px;color:#94a3b8;">${model.tripLabel} · ${model.legs} trecho${model.legs > 1 ? 's' : ''}</span>
        </div>
        <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.04em;margin-bottom:10px;">VOO DE IDA</div>
        <div style="background:#f8fafc;border-radius:12px;padding:14px;">
          <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:12px;">${model.outbound.dateLabel}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="min-width:72px;">
              <div style="font-size:20px;font-weight:800;color:#0f172a;">${model.outbound.depTime}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">${model.outbound.originLabel}</div>
            </div>
            <div style="flex:1;text-align:center;padding:0 8px;">
              <div style="font-size:10px;font-weight:700;color:#64748b;">${model.outbound.flightNumber}</div>
              <div style="font-size:18px;color:#2563eb;margin:2px 0;">✈</div>
              <div style="height:2px;background:#cbd5e1;position:relative;margin:4px 0;">
                <div style="position:absolute;left:0;top:-3px;width:8px;height:8px;border-radius:50%;background:#cbd5e1;"></div>
                <div style="position:absolute;right:0;top:-3px;width:8px;height:8px;border-radius:50%;background:#cbd5e1;"></div>
              </div>
              <div style="font-size:10px;color:#94a3b8;">${model.outbound.duration}</div>
            </div>
            <div style="min-width:72px;text-align:right;">
              <div style="font-size:20px;font-weight:800;color:#0f172a;">${model.outbound.arrTime}${model.outbound.nextDay ? '+1' : ''}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">${model.outbound.destLabel}</div>
            </div>
            <span style="color:#94a3b8;font-size:16px;">👁</span>
          </div>
        </div>
        ${model.inbound ? `
          <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.04em;margin:14px 0 10px;">VOO DE VOLTA</div>
          <div style="background:#f8fafc;border-radius:12px;padding:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="min-width:72px;">
                <div style="font-size:20px;font-weight:800;">${model.inbound.depTime}</div>
                <div style="font-size:11px;color:#64748b;">${model.inbound.origin}</div>
              </div>
              <div style="flex:1;text-align:center;font-size:18px;color:#2563eb;">✈</div>
              <div style="min-width:72px;text-align:right;">
                <div style="font-size:11px;color:#64748b;">${model.inbound.destination}</div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <div style="padding:20px 24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
          <span style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.08em;">BAGAGENS</span>
          <span style="font-size:11px;color:#94a3b8;">${model.baggageCount} item${model.baggageCount !== 1 ? 's' : ''}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
          ${model.baggage.map(b => `
            <div style="background:#f8fafc;border-radius:12px;padding:10px 8px;text-align:center;">
              <div style="font-size:16px;margin-bottom:4px;">🧳</div>
              <div style="font-size:9px;font-weight:600;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.label}</div>
              <div style="font-size:9px;color:#94a3b8;margin-bottom:6px;">${b.weight}</div>
              <div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:700;">
                <span style="width:22px;height:22px;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;color:#94a3b8;">−</span>
                <span>${b.count}</span>
                <span style="width:22px;height:22px;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;">+</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      ${model.dataSource === 'serpapi' ? `
        <div style="padding:10px 24px;background:#f0fdf4;border-top:1px solid #bbf7d0;font-size:10px;color:#16a34a;text-align:center;">
          ✓ Preço verificado via Google Flights (SerpAPI)
          ${reservation.verifyUrl ? ` · <a href="${reservation.verifyUrl}" style="color:#15803d;font-weight:600">Abrir busca ↗</a>` : ''}
        </div>
      ` : model.dataSource === 'amadeus' ? `
        <div style="padding:10px 24px;background:#f0fdf4;border-top:1px solid #bbf7d0;font-size:10px;color:#16a34a;text-align:center;">
          ✓ Dados de voo verificados via Amadeus
        </div>
      ` : ''}
    </div>
  `;
}

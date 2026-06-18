/** Converte resultado da consulta externa → formato do store */
export function lookupResultToReservation(data, extra = {}) {
  return {
    locator: data.locator,
    airline: data.airline,
    passengers: (data.passengers || []).map(p => ({
      name: p.name,
      ticketId: p.ticketNumber,
      seat: p.seat,
      email: p.email,
      phone: p.phone,
      checkinStatus: p.checkinStatus,
    })),
    outbound: data.outbound ? {
      ...data.outbound,
      status: data.outbound.status || 'Confirmado',
    } : null,
    inbound: data.inbound || null,
    baggage: data.baggage,
    description: extra.description || '',
    value: extra.value || 0,
    status: data.status || 'Confirmado',
    dataSource: data.source,
    sourceLabel: data.sourceLabel,
    verifyUrl: data.verifyUrl,
    contact: data.contact,
    fetchedAt: data.fetchedAt,
  };
}

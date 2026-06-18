export async function lookupReservation({ airline, locator, lastName }) {
  const res = await fetch('/api/reservations/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ airline, locator, lastName }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Erro ao consultar reserva');
  }

  return data;
}

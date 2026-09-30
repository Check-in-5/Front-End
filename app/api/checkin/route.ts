import { validateTicketQr } from '../../../lib/validate-ticket-qr';

export async function POST(request: Request) {
  const input = validateTicketQr(await request.text());
  if (!input.ok) {
    return Response.json({ error: { message: input.error } }, { status: 400 });
  }

  try {
    const base = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(new URL('/api/v1/checkin/validaciones', base), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input.data),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const body: unknown = await response.json();
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ error: { message: 'No se pudo consultar el backend. Verifica que esté funcionando e intenta nuevamente.' } }, { status: 502 });
  }
}

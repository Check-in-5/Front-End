export type TicketQr = {
  id_entrada: string;
  id_evento: string;
};

export type TicketQrValidation =
  | { ok: true; data: TicketQr }
  | { ok: false; error: string };

export function validateTicketQr(raw: string): TicketQrValidation {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'El QR debe contener un JSON válido.' };
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, error: 'El QR debe contener un objeto con id_entrada e id_evento.' };
  }

  for (const field of ['id_entrada', 'id_evento'] as const) {
    if (!Object.hasOwn(value, field)) {
      return { ok: false, error: `Falta el campo obligatorio ${field}.` };
    }
    const content = (value as Record<string, unknown>)[field];
    if (typeof content !== 'string' || content.trim().length === 0) {
      return { ok: false, error: `El campo ${field} debe ser un texto no vacío.` };
    }
  }

  const ticket = value as TicketQr;
  return { ok: true, data: { id_entrada: ticket.id_entrada, id_evento: ticket.id_evento } };
}

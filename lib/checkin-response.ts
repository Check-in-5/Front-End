export type CheckinResult =
  | { valido: true; motivo: 'TICKET_FOUND'; ticket: { id_entrada: string; id_evento: string; nombre_usuario: string } }
  | { valido: false; motivo: 'TICKET_NOT_FOUND' | 'EVENT_MISMATCH' };

export function parseCheckinResponse(value: unknown): CheckinResult {
  if (typeof value === 'object' && value !== null) {
    const data = value as Record<string, unknown>;
    if (data.valido === false && (data.motivo === 'TICKET_NOT_FOUND' || data.motivo === 'EVENT_MISMATCH')) {
      return { valido: false, motivo: data.motivo };
    }
    if (data.valido === true && data.motivo === 'TICKET_FOUND' && typeof data.ticket === 'object' && data.ticket !== null) {
      const ticket = data.ticket as Record<string, unknown>;
      if (typeof ticket.id_entrada === 'string' && ticket.id_entrada.trim() &&
          typeof ticket.id_evento === 'string' && ticket.id_evento.trim() &&
          typeof ticket.nombre_usuario === 'string' && ticket.nombre_usuario.trim()) {
        return { valido: true, motivo: 'TICKET_FOUND', ticket: {
          id_entrada: ticket.id_entrada, id_evento: ticket.id_evento, nombre_usuario: ticket.nombre_usuario,
        } };
      }
    }
  }
  throw new Error('El backend devolvió una respuesta inesperada. Intenta nuevamente.');
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCheckinResponse } from '../lib/checkin-response.ts';

test('acepta una entrada encontrada con los datos del usuario', () => {
  const result = { valido: true, motivo: 'TICKET_FOUND', ticket: {
    id_entrada: 'tk-1', id_evento: 'evt-1', nombre_usuario: 'Usuario de prueba',
  } };
  assert.deepEqual(parseCheckinResponse(result), result);
});

for (const motivo of ['TICKET_NOT_FOUND', 'EVENT_MISMATCH']) {
  test(`mantiene el rechazo ${motivo} aunque HTTP sea 200`, () => {
    assert.deepEqual(parseCheckinResponse({ valido: false, motivo }), { valido: false, motivo });
  });
}

for (const body of [null, {}, [], 'ok', { valido: 'true' }, { valido: true, motivo: 'TICKET_FOUND' },
  { valido: false, motivo: 'desconocido' },
  { valido: true, motivo: 'TICKET_FOUND', ticket: { id_entrada: 'tk-1', id_evento: 'evt-1', nombre_usuario: '' } }]) {
  test(`no acepta respuestas incompletas: ${JSON.stringify(body)}`, () => {
    assert.throws(() => parseCheckinResponse(body), /respuesta inesperada/);
  });
}

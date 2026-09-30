import assert from 'node:assert/strict';
import test from 'node:test';
import { validateTicketQr } from '../lib/validate-ticket-qr.ts';

test('acepta el formato esperado y conserva los identificadores', () => {
  const data = { id_entrada: 'tk-998877', id_evento: 'evt-77889' };
  assert.deepEqual(validateTicketQr(JSON.stringify(data)), { ok: true, data });
});

test('acepta campos adicionales sin incluirlos en el resultado', () => {
  assert.deepEqual(validateTicketQr('{"id_evento":"evento","id_entrada":"entrada","extra":true}'), {
    ok: true, data: { id_entrada: 'entrada', id_evento: 'evento' },
  });
});

for (const raw of ['', 'https://example.com', '{', '{"id_entrada":}']) {
  test(`rechaza contenido que no es JSON válido: ${JSON.stringify(raw)}`, () => {
    assert.equal(validateTicketQr(raw).ok, false);
  });
}

for (const value of [null, [], 123, true, 'texto', [{ id_entrada: 'tk-1', id_evento: 'evt-1' }]]) {
  test(`rechaza una raíz que no sea objeto: ${JSON.stringify(value)}`, () => {
    assert.equal(validateTicketQr(JSON.stringify(value)).ok, false);
  });
}

for (const field of ['id_entrada', 'id_evento']) {
  for (const invalid of [undefined, null, '', ' \n\t ', 123, false, [], {}]) {
    test(`rechaza ${field} ausente o inválido: ${JSON.stringify(invalid)}`, () => {
      const payload = { id_entrada: 'tk-998877', id_evento: 'evt-77889', [field]: invalid };
      const result = validateTicketQr(JSON.stringify(payload));
      assert.equal(result.ok, false);
      assert.ok(result.error.includes(field));
    });
  }
}

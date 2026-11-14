import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ESPERA_DEL_PAGO_MS, descuentoDelCodigo, etiquetaDelCodigo, motivoCodigoNoAplica, normalizarCodigoLocal, seLibero,
} from './codigoDescuento.js'

const AHORA = Date.parse('2026-11-14T18:00:00Z')
const vigente = { codigo: 'ABCD2345', porcentaje: 10, vence_at: '2026-11-22T02:59:59Z', usado_at: null }

test('normaliza lo que tipea el cliente', () => {
  assert.equal(normalizarCodigoLocal(' abcd-2345 '), 'ABCD2345')
  assert.equal(normalizarCodigoLocal('*ABCD2345*'), 'ABCD2345')
  assert.equal(normalizarCodigoLocal(null), '')
})

test('un codigo vigente y sin usar se puede usar', () => {
  assert.equal(motivoCodigoNoAplica(vigente, { comida: 10000, ahora: AHORA }), '')
})

test('no existe, vencido, usado, sin productos', () => {
  assert.match(motivoCodigoNoAplica(null, { comida: 1, ahora: AHORA }), /no existe/)
  assert.match(motivoCodigoNoAplica({ ...vigente, vence_at: '2026-11-14T17:59:59Z' }, { comida: 1, ahora: AHORA }), /venció/)
  assert.match(
    motivoCodigoNoAplica({ ...vigente, usado_at: '2026-11-14T12:00:00Z' }, { pedido: { status: 'new' }, comida: 1, ahora: AHORA }),
    /ya se usó/,
  )
  assert.match(motivoCodigoNoAplica(vigente, { comida: 0, ahora: AHORA }), /Agregá productos/)
})

test('vale hasta el ultimo segundo del vencimiento', () => {
  const justo = Date.parse(vigente.vence_at)
  assert.equal(motivoCodigoNoAplica(vigente, { comida: 1, ahora: justo }), '')
  assert.match(motivoCodigoNoAplica(vigente, { comida: 1, ahora: justo + 1000 }), /venció/)
})

test('un codigo usado se libera si el pedido se cancelo o se borro', () => {
  const usado = { ...vigente, usado_at: '2026-11-14T12:00:00Z' }
  assert.equal(seLibero(usado, { status: 'cancelled' }, AHORA), true)
  assert.equal(seLibero(usado, null, AHORA), true)
  // Recien tomado y todavia sin pedido (se esta creando): NO esta libre.
  assert.equal(seLibero({ ...vigente, usado_at: new Date(AHORA - 3000).toISOString() }, null, AHORA), false)
  assert.equal(seLibero(usado, { status: 'delivered' }, AHORA), false)
  assert.equal(seLibero(usado, { status: 'new' }, AHORA), false)
  assert.equal(motivoCodigoNoAplica(usado, { pedido: { status: 'cancelled' }, comida: 1, ahora: AHORA }), '')
})

test('esperando el pago: se libera recien pasado el rato', () => {
  const usadoAt = AHORA - ESPERA_DEL_PAGO_MS
  const usado = { ...vigente, usado_at: new Date(usadoAt).toISOString() }
  assert.equal(seLibero(usado, { status: 'pendiente_pago' }, AHORA), false)
  assert.equal(seLibero(usado, { status: 'pendiente_pago' }, AHORA + 1000), true)
})

test('un codigo liberado pero vencido igual no vale', () => {
  const usado = { ...vigente, usado_at: '2026-11-14T12:00:00Z', vence_at: '2026-11-14T17:00:00Z' }
  assert.match(motivoCodigoNoAplica(usado, { pedido: { status: 'cancelled' }, comida: 1, ahora: AHORA }), /venció/)
})

test('el descuento es el porcentaje de la comida, redondeado', () => {
  assert.equal(descuentoDelCodigo(vigente, 10000), 1000)
  assert.equal(descuentoDelCodigo({ porcentaje: 15 }, 13500), 2025)
  assert.equal(descuentoDelCodigo({ porcentaje: 10 }, 9995), 1000)
  assert.equal(descuentoDelCodigo({ porcentaje: 100 }, 5000), 5000)
  assert.equal(descuentoDelCodigo({ porcentaje: 250 }, 5000), 5000)
  assert.equal(descuentoDelCodigo({ porcentaje: 10 }, 0), 0)
  assert.equal(descuentoDelCodigo({ porcentaje: 10 }, -50), 0)
  assert.equal(descuentoDelCodigo(null, 5000), 0)
})

test('la etiqueta que lee el local', () => {
  assert.equal(etiquetaDelCodigo(vigente), 'Código ABCD2345 (10%)')
})

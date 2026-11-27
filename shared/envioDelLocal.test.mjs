import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cotizacionSinCosto, envioLoPagaElLocal } from './envioDelLocal.js'

test('solo con Capta y con el interruptor prendido', () => {
  assert.equal(envioLoPagaElLocal({ deliveryCapta: true, captaEnvioPagaElLocal: true }), true)
  for (const s of [undefined, {}, { captaEnvioPagaElLocal: true }, { deliveryCapta: true }, { deliveryCapta: true, captaEnvioPagaElLocal: 'true' }]) {
    assert.equal(envioLoPagaElLocal(s), false, JSON.stringify(s))
  }
})

test('la cotizacion queda en cero sin perder la zona ni las opciones', () => {
  const c = cotizacionSinCosto({
    allowed: true,
    fee: 2700,
    zone: { name: 'Centro', fee: 2700 },
    coordinates: { lat: -34.9, lng: -60 },
    candidates: [{ id: 'a', label: 'Ayacucho 951', allowed: true, fee: 3000, zone: { name: 'B', fee: 3000 } }],
    posibles: [{ id: 'z', name: 'Centro', fee: 2700 }],
    aviso: 'Puede salir $2.700 o $3.000',
  })
  assert.deepEqual([c.allowed, c.fee, c.zone.fee, c.zone.name], [true, 0, 0, 'Centro'])
  assert.deepEqual([c.candidates[0].fee, c.candidates[0].zone.fee, c.candidates[0].label], [0, 0, 'Ayacucho 951'])
  assert.equal(c.posibles[0].fee, 0)
  assert.equal(c.aviso, undefined)
  assert.deepEqual(cotizacionSinCosto({ allowed: false, message: 'Fuera de zona' }), { allowed: false, message: 'Fuera de zona' })
  assert.equal(cotizacionSinCosto(null), null)
})

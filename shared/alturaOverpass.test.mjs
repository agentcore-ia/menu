// node --test shared/alturaOverpass.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nombreDeCalleDeEtiqueta, ubicarAltura } from './alturaOverpass.js'

const PELLEGRINI = [
  { n: 1000, lat: -34.88251, lng: -60.00432 },
  { n: 1050, lat: -34.88181, lng: -60.00352 },
  { n: 1100, lat: -34.8811, lng: -60.00272 },
  { n: 1150, lat: -34.88042, lng: -60.00193 },
  { n: 1200, lat: -34.87972, lng: -60.00116 },
  { n: 1250, lat: -34.87903, lng: -60.00037 },
]

test('exacta, interpolada y extrapolada', () => {
  assert.equal(ubicarAltura(1100, PELLEGRINI).tipo, 'exacta')
  assert.equal(ubicarAltura(1075, PELLEGRINI).tipo, 'interpolada')
  const p = ubicarAltura(1300, PELLEGRINI)
  assert.equal(p.tipo, 'extrapolada')
  assert.ok(p.lat > -34.87903 && p.lng > -60.00037)
})

test('demasiado lejos o sin puertas: nada', () => {
  assert.equal(ubicarAltura(1900, PELLEGRINI), null)
  assert.equal(ubicarAltura(500, []), null)
})

test('nombre de la calle de una etiqueta', () => {
  assert.equal(nombreDeCalleDeEtiqueta('1000, Carlos Pellegrini, Chivilcoy'), 'Carlos Pellegrini')
})

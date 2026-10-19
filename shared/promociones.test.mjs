import test from 'node:test'
import assert from 'node:assert/strict'
import { describirVigencia, normalizarPromociones, promoVigente } from './promociones.js'

// Fechas en hora argentina (UTC-3): lunes 19/10/2026 a las 20:00 = 23:00 UTC.
const lunes20 = new Date('2026-10-19T23:00:00Z')
const lunes10 = new Date('2026-10-19T13:00:00Z')
const martes0130 = new Date('2026-10-20T04:30:00Z') // lunes 19 a las 01:30 ART del martes 20
const sabado12 = new Date('2026-10-24T15:00:00Z')

test('sin dias ni horas se vende siempre', () => {
  assert.equal(promoVigente({ dias: [], desde: '', hasta: '' }, lunes20), true)
  assert.equal(promoVigente(null, lunes20), true)
})

test('solo algunos dias', () => {
  const lunesAJueves = { dias: [1, 2, 3, 4], desde: '', hasta: '' }
  assert.equal(promoVigente(lunesAJueves, lunes20), true)
  assert.equal(promoVigente(lunesAJueves, sabado12), false)
})

test('horario dentro del dia', () => {
  const noche = { dias: [1], desde: '19:00', hasta: '23:00' }
  assert.equal(promoVigente(noche, lunes20), true)
  assert.equal(promoVigente(noche, lunes10), false)
  // La hora de cierre ya no vende.
  assert.equal(promoVigente({ dias: [], desde: '19:00', hasta: '20:00' }, lunes20), false)
})

test('horario que cruza la medianoche cuenta para el dia que arranca', () => {
  const madrugada = { dias: [1], desde: '22:00', hasta: '02:00' }
  // Martes 01:30 sigue siendo la promo del lunes.
  assert.equal(promoVigente(madrugada, martes0130), true)
  assert.equal(promoVigente(madrugada, lunes10), false)
  assert.equal(promoVigente({ dias: [2], desde: '22:00', hasta: '02:00' }, martes0130), false)
})

test('solo desde o solo hasta', () => {
  assert.equal(promoVigente({ dias: [], desde: '19:00', hasta: '' }, lunes10), false)
  assert.equal(promoVigente({ dias: [], desde: '19:00', hasta: '' }, lunes20), true)
  assert.equal(promoVigente({ dias: [], desde: '', hasta: '12:00' }, lunes20), false)
})

test('se limpia lo guardado', () => {
  const [p] = normalizarPromociones([
    { productoId: ' a ', dias: [3, 3, 9, 'x', 1], desde: '7:00', hasta: '23:59' },
    { productoId: 'a', dias: [] },
    { dias: [1] },
  ])
  assert.deepEqual(p, { productoId: 'a', dias: [1, 3], desde: '', hasta: '23:59' })
  assert.equal(normalizarPromociones([{ productoId: 'b', dias: [0, 1, 2, 3, 4, 5, 6] }])[0].dias.length, 0)
})

test('se describe para el cliente', () => {
  assert.equal(describirVigencia({ dias: [1, 2, 3, 4], desde: '19:00', hasta: '23:30' }), 'lunes a jueves de 19:00 a 23:30')
  assert.equal(describirVigencia({ dias: [2, 6], desde: '', hasta: '' }), 'martes y sábado')
  assert.equal(describirVigencia({ dias: [], desde: '20:00', hasta: '' }), 'todos los días desde las 20:00')
})

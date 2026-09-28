// En que horario se puede pedir el menu del dia.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  leerHorarioMenuDelDia,
  menuDelDiaDisponible,
  minutosEnArgentina,
  textoHorarioMenuDelDia,
} from './horarioMenuDelDia.js'

/** Una hora de Argentina (UTC-3) como Date. */
const a = (hhmm) => new Date(`2026-09-28T${hhmm}:00-03:00`)

const nocturno = { desde: '20:00', hasta: '23:30' }

test('sin horario cargado se pide siempre, como antes', () => {
  assert.equal(leerHorarioMenuDelDia(null), null)
  assert.equal(leerHorarioMenuDelDia({ _settings: {} }), null)
  assert.equal(menuDelDiaDisponible(null, a('13:00')), true)
})

test('se lee de los ajustes del local', () => {
  assert.deepEqual(leerHorarioMenuDelDia({ _settings: { menuDelDiaHorario: nocturno } }), nocturno)
})

test('un horario mal cargado no bloquea: se ignora', () => {
  for (const h of [{ desde: '25:00', hasta: '23:00' }, { desde: '20:00' }, { desde: '8', hasta: '12' }, { desde: '20:00', hasta: '20:00' }]) {
    assert.equal(leerHorarioMenuDelDia({ _settings: { menuDelDiaHorario: h } }), null, JSON.stringify(h))
  }
})

test('el menu nocturno no se pide al mediodia (Babson)', () => {
  assert.equal(menuDelDiaDisponible(nocturno, a('12:30')), false)
  assert.equal(menuDelDiaDisponible(nocturno, a('19:59')), false)
})

test('el menu nocturno se pide a la noche', () => {
  assert.equal(menuDelDiaDisponible(nocturno, a('20:00')), true)
  assert.equal(menuDelDiaDisponible(nocturno, a('23:29')), true)
})

test('a la hora de cierre ya no', () => {
  assert.equal(menuDelDiaDisponible(nocturno, a('23:30')), false)
})

test('un horario que pasa la medianoche', () => {
  const tarde = { desde: '20:00', hasta: '01:00' }
  assert.equal(menuDelDiaDisponible(tarde, a('23:00')), true)
  assert.equal(menuDelDiaDisponible(tarde, a('00:30')), true)
  assert.equal(menuDelDiaDisponible(tarde, a('01:00')), false)
  assert.equal(menuDelDiaDisponible(tarde, a('13:00')), false)
})

test('el menu del mediodia no se pide a la noche', () => {
  const mediodia = { desde: '11:30', hasta: '15:00' }
  assert.equal(menuDelDiaDisponible(mediodia, a('12:00')), true)
  assert.equal(menuDelDiaDisponible(mediodia, a('21:00')), false)
})

test('la hora se mide en Argentina, no en la del servidor', () => {
  // 23:10 UTC son las 20:10 en Argentina.
  assert.equal(minutosEnArgentina(new Date('2026-09-28T23:10:00Z')), 20 * 60 + 10)
})

test('el texto para el cliente', () => {
  assert.equal(textoHorarioMenuDelDia(nocturno), 'de 20:00 a 23:30')
  assert.equal(textoHorarioMenuDelDia(null), '')
})

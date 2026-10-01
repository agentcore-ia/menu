import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  aceptaProgramados,
  anticipoDelLocal,
  textoDelTurno,
  turnosParaProgramar,
  validarProgramado,
} from './pedidoProgramado.js'

const noche = { abierto: true, desde: '19:00', hasta: '23:30' }
const cerrado = { abierto: false, desde: '19:00', hasta: '23:30' }
// Abre todas las noches menos el lunes.
const horarios = {
  domingo: noche, lunes: cerrado, martes: noche, miercoles: noche, jueves: noche, viernes: noche, sabado: noche,
}
// Jueves 1/10/2026, 15:00 en Argentina (18:00 UTC): cerrado, abre a las 19.
const jueves15 = new Date('2026-10-01T18:00:00Z')
const hora = (iso) => new Date(Date.parse(iso) - 3 * 3600 * 1000).toISOString().slice(11, 16)

test('los locales de Capta lo traen prendido; cada uno lo puede apagar', () => {
  assert.equal(aceptaProgramados({ _settings: { deliveryCapta: true } }), true)
  assert.equal(aceptaProgramados({ _settings: { deliveryCapta: true, aceptaProgramados: false } }), false)
  assert.equal(aceptaProgramados({ _settings: {} }), false)
  assert.equal(aceptaProgramados({ _settings: { aceptaProgramados: true } }), true)
})

test('el anticipo sale de lo que el local dice que tarda', () => {
  assert.equal(anticipoDelLocal('30-45 min'), 45)
  assert.equal(anticipoDelLocal(''), 40)
  assert.equal(anticipoDelLocal('10 min'), 20)
  assert.equal(anticipoDelLocal('2 horas 120'), 90)
})

test('se ofrece cada media hora desde que le da el tiempo, hasta que cierra', () => {
  const turnos = turnosParaProgramar(horarios, jueves15, { anticipo: 40 })
  const hoy = turnos.filter((t) => t.texto.startsWith('hoy'))
  // Abre 19:00 + 40 min = 19:40 -> el primero redondo es 20:00; el ultimo, 23:30.
  assert.deepEqual(hoy.map((t) => hora(t.iso)), ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'])
  assert.equal(hoy[0].texto, 'hoy a las 20:00')
  // Mañana viernes tambien (dentro de las 36 h).
  assert.ok(turnos.some((t) => t.texto === 'mañana a las 21:00'))
})

test('un dia cerrado no ofrece nada, y no se programa para dentro de dos dias', () => {
  // Domingo 4/10 a las 23:45 con el lunes cerrado: el martes queda a mas de 36 h.
  assert.deepEqual(turnosParaProgramar(horarios, new Date('2026-10-05T02:45:00Z'), { anticipo: 40 }), [])
  // El lunes a la tarde ya se puede dejar para el martes a la noche.
  const lunes15 = new Date('2026-10-05T18:00:00Z')
  const turnos = turnosParaProgramar(horarios, lunes15, { anticipo: 40 })
  assert.ok(turnos.length > 0)
  assert.ok(turnos.every((t) => t.texto.startsWith('mañana')), turnos[0]?.texto)
})

test('un turno que cruza la medianoche se ofrece hasta su cierre', () => {
  const trasnoche = { abierto: true, desde: '20:00', hasta: '02:00' }
  const h = { domingo: trasnoche, lunes: trasnoche, martes: trasnoche, miercoles: trasnoche, jueves: trasnoche, viernes: trasnoche, sabado: trasnoche }
  // Viernes 00:30 (abierto desde el jueves): 00:30 + 40 = 01:10 -> 01:30 y 02:00.
  const turnos = turnosParaProgramar(h, new Date('2026-10-02T03:30:00Z'), { anticipo: 40 })
  assert.deepEqual(turnos.slice(0, 2).map((t) => hora(t.iso)), ['01:30', '02:00'])
  assert.equal(turnos[0].texto, 'hoy a las 01:30')
})

test('el pedido entra a la cocina el anticipo antes, nunca antes de abrir', () => {
  const r = validarProgramado(horarios, '2026-10-02T00:00:00Z', jueves15, { anticipo: 40 }) // 21:00
  assert.equal(r.ok, true)
  assert.equal(hora(r.creadoEn), '20:20')
  assert.equal(r.texto, 'hoy a las 21:00')

  const primero = validarProgramado(horarios, '2026-10-01T23:00:00Z', jueves15, { anticipo: 90 }) // 20:00 con 90 de anticipo
  assert.equal(primero.ok, false) // con 90 min el primero es 20:30

  const veinteYMedia = validarProgramado(horarios, '2026-10-01T23:30:00Z', jueves15, { anticipo: 90 })
  assert.equal(hora(veinteYMedia.creadoEn), '19:00') // 20:30 - 90 = 19:00, justo cuando abre
})

test('una hora inventada o fuera de horario se rechaza', () => {
  assert.equal(validarProgramado(horarios, '2026-10-01T21:00:00Z', jueves15).ok, false) // 18:00, cerrado
  assert.equal(validarProgramado(horarios, '2026-10-02T00:10:00Z', jueves15).ok, false) // 21:10, no es un turno
  assert.equal(validarProgramado(horarios, 'mañana', jueves15).ok, false)
})

test('el texto dice el dia como lo diria una persona', () => {
  assert.equal(textoDelTurno('2026-10-02T00:00:00Z', jueves15), 'hoy a las 21:00')
  assert.equal(textoDelTurno('2026-10-03T00:00:00Z', jueves15), 'mañana a las 21:00')
  assert.equal(textoDelTurno('2026-10-04T00:00:00Z', jueves15), 'el sábado a las 21:00')
})

// node --test shared/diasDisponibles.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { describirDias, diaDeHoyEnArgentina, diasDelTexto, productoDisponibleHoy } from './diasDisponibles.js'

const lista = (texto) => {
  const d = diasDelTexto(texto)
  return d ? [...d].sort() : null
}

test('rango de lunes a jueves', () => {
  assert.deepEqual(lista('Llevás 4 potes de 1/4 y pagás 3. De lunes a jueves. Solo efectivo.'), [1, 2, 3, 4])
})

test('rango que da la vuelta a la semana', () => {
  assert.deepEqual(lista('de viernes a domingo'), [0, 5, 6])
})

test('dias sueltos y con tilde', () => {
  assert.deepEqual(lista('Solo martes y jueves'), [2, 4])
  assert.deepEqual(lista('Solo los sábados'), [6])
  assert.deepEqual(lista('solo sabados y domingos'), [0, 6])
  assert.deepEqual(lista('Sólo el miércoles'), [3])
})

test('sin dias no limita', () => {
  assert.equal(diasDelTexto('2 kilos con sabores a elección. Solo efectivo.'), null)
  assert.equal(diasDelTexto(''), null)
  // "mar" suelto como abreviatura no se toma: es una palabra comun ("mar del plata")
  assert.equal(diasDelTexto('Frutos de mar'), null)
})

test('el dia se cuenta en hora argentina', () => {
  // Viernes 00:30 en Argentina es viernes 03:30 UTC
  assert.equal(diaDeHoyEnArgentina(new Date('2026-09-18T03:30:00Z')), 5)
  // Jueves 23:30 en Argentina es viernes 02:30 UTC: sigue siendo jueves
  assert.equal(diaDeHoyEnArgentina(new Date('2026-09-18T02:30:00Z')), 4)
})

test('la promo 4x3 de Troka', () => {
  const promo = { name: '4x3 en cuartos', description: 'Llevás 4 potes de 1/4 y pagás 3. De lunes a jueves. Solo efectivo.' }
  assert.equal(productoDisponibleHoy(promo, new Date('2026-09-17T18:00:00Z')), true) // jueves
  assert.equal(productoDisponibleHoy(promo, new Date('2026-09-18T18:00:00Z')), false) // viernes
  assert.equal(productoDisponibleHoy(promo, new Date('2026-09-20T18:00:00Z')), false) // domingo
  assert.equal(productoDisponibleHoy(promo, new Date('2026-09-21T18:00:00Z')), true) // lunes
  assert.equal(productoDisponibleHoy({ name: '2 kilos', description: 'Solo efectivo' }, new Date('2026-09-20T18:00:00Z')), true)
})

test('describir los dias', () => {
  assert.equal(describirDias(new Set([1, 2, 3, 4])), 'de lunes a jueves')
  assert.equal(describirDias(new Set([2, 4])), 'martes y jueves')
  assert.equal(describirDias(new Set([6])), 'los sábados')
})

test('un dia nombrado de pasada no limita', () => {
  assert.equal(
    diasDelTexto('Armá tu propio pack: el lunes viene incluido en el precio base y sumás sólo los días que necesites'),
    null,
  )
  assert.equal(diasDelTexto('Lunes a viernes al mediodía'), null)
})

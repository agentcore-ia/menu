// Las palabras del menu segun el rubro.
//
// Lo que se cuida es que un local que ya vende NO cambie: todos los que hay hoy
// son restaurantes y no configuraron ningun rubro.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rubroDelMenu, textosDelMenu, RUBROS } from './rubros.js'

test('sin rubro configurado, todo sigue diciendo lo de siempre', () => {
  for (const entrada of [null, undefined, {}, { _settings: {} }, 'cualquier cosa', []]) {
    assert.equal(rubroDelMenu(entrada).id, 'restaurante', JSON.stringify(entrada))
  }
  assert.equal(RUBROS.restaurante.catalogo, 'Menu digital')
  assert.equal(RUBROS.restaurante.kicker, 'MENU DESTACADO')
  assert.equal(RUBROS.restaurante.heroTitulo, 'Cocina honesta,')
})

test('un rubro que no conocemos cae en restaurante', () => {
  assert.equal(rubroDelMenu({ _settings: { rubro: 'heladeria-espacial' } }).id, 'restaurante')
})

test('los comercios hablan de catalogo, no de menu', () => {
  for (const id of ['kiosco', 'dietetica', 'farmacia', 'otro']) {
    const r = rubroDelMenu({ _settings: { rubro: id } })
    assert.equal(r.id, 'comercio', id)
    assert.equal(r.catalogo, 'Catalogo online')
    assert.doesNotMatch(r.heroTexto, /plato|carta|cocina/i, `${id} no habla de platos`)
  }
})

test('la panaderia tiene su propio tono', () => {
  const r = rubroDelMenu({ _settings: { rubro: 'panaderia' } })
  assert.equal(r.id, 'panaderia')
  assert.match(r.heroTitulo, /Recién hecho/)
})

test('textosDelMenu acepta lo que viene del servidor', () => {
  // El servidor manda el id ya resuelto, no el rubro del dashboard.
  assert.equal(textosDelMenu('comercio').catalogo, 'Catalogo online')
  assert.equal(textosDelMenu('restaurante').catalogo, 'Menu digital')
  assert.equal(textosDelMenu(undefined).catalogo, 'Menu digital', 'sin dato, restaurante')
  assert.equal(textosDelMenu('kiosco').catalogo, 'Menu digital', 'un id que no existe de este lado no rompe')
})

test('todos los rubros tienen las mismas palabras definidas', () => {
  // Si a uno le falta una, la pantalla quedaria con un hueco.
  const claves = Object.keys(RUBROS.restaurante).sort()
  for (const r of Object.values(RUBROS)) {
    assert.deepEqual(Object.keys(r).sort(), claves, r.id)
    for (const [k, v] of Object.entries(r)) assert.ok(String(v).trim(), `${r.id}.${k} vacio`)
  }
})

test('el rubro sale de lo que se cargo al crear la cuenta', () => {
  assert.equal(rubroDelMenu(null, 'panaderia').id, 'panaderia')
  assert.equal(rubroDelMenu(null, 'kiosco').id, 'comercio')
  assert.equal(rubroDelMenu(null, 'farmacia').id, 'comercio')
  // Los tipos gastronomicos de siempre siguen siendo restaurantes.
  for (const t of ['restaurant', 'cafeteria', 'heladeria', 'pizzeria', 'bar', 'rotiseria', 'otro', '', null]) {
    assert.equal(rubroDelMenu(null, t).id, 'restaurante', String(t))
  }
})

test('lo elegido a mano le gana a lo del alta', () => {
  assert.equal(rubroDelMenu({ _settings: { rubro: 'kiosco' } }, 'restaurant').id, 'comercio')
  assert.equal(rubroDelMenu({ _settings: { rubro: 'restaurante' } }, 'panaderia').id, 'restaurante')
  assert.equal(rubroDelMenu({ _settings: { rubro: 'no-existe' } }, 'panaderia').id, 'panaderia')
})

test('el menu del dia es solo de restaurantes', () => {
  assert.equal(rubroDelMenu(null, 'restaurant').menuDelDia, true)
  assert.equal(rubroDelMenu(null, null).menuDelDia, true, 'sin rubro, como siempre')
  assert.equal(rubroDelMenu(null, 'panaderia').menuDelDia, false)
  assert.equal(rubroDelMenu(null, 'kiosco').menuDelDia, false)
  assert.equal(rubroDelMenu({ _settings: { rubro: 'kiosco' } }, 'restaurant').menuDelDia, false)
})

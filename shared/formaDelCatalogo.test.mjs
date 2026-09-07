// Que un local que ya vende NO cambie, y que una heladeria se detecte sola.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formaDelCatalogo } from './formaDelCatalogo.js'

const cat = (label, precios) => ({ label, items: precios.map((unitPrice) => ({ unitPrice })) })

const HELADERIA = [
  cat('Formato/Tamaño', [20000, 12000, 7000, 5000]),
  cat('Sabores', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
]

test('una heladeria se reconoce por como esta cargada', () => {
  const forma = formaDelCatalogo(HELADERIA)
  assert.equal(forma.porFormato, true)
  assert.deepEqual(forma.quePiden, ['Formato/Tamaño'])
  assert.deepEqual(forma.deEleccion, ['Sabores'])
})

test('un restaurante normal no vende por formato', () => {
  // Lo que no puede pasar: que a un local que ya vende bien le aparezca de
  // golpe un selector de sabores.
  const forma = formaDelCatalogo([
    cat('Pizzas', [17500, 18800, 19500]),
    cat('Postres', [8000, 8500]),
  ])
  assert.equal(forma.porFormato, false)
  assert.deepEqual(forma.deEleccion, [])
})

test('dos productos en cero son un error de carga, no un menu de sabores', () => {
  const forma = formaDelCatalogo([cat('Pizzas', [17500, 18800]), cat('Raro', [0, 0])])
  assert.equal(forma.porFormato, false)
})

test('sin nada con precio no hay formato al que pegarle la eleccion', () => {
  // Un local que cargo TODO en cero tiene otro problema, no esta forma de vender.
  const forma = formaDelCatalogo([cat('Sabores', [0, 0, 0, 0])])
  assert.equal(forma.porFormato, false)
  assert.deepEqual(forma.deEleccion, [])
})

test('no se rompe con entradas raras', () => {
  for (const entrada of [null, undefined, [], {}, 'cualquier cosa']) {
    assert.equal(formaDelCatalogo(entrada).porFormato, false, JSON.stringify(entrada))
  }
  assert.equal(formaDelCatalogo([{ label: 'Vacia', items: [] }]).porFormato, false)
})

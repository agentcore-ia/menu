import assert from 'node:assert/strict'
import test from 'node:test'
import {
  categoriaDeVitrina,
  ciudadPareja,
  envioDesde,
  localCoincideCon,
  localVisibleEnVitrina,
  nombreDeCategoria,
  tiempoDeEntrega,
} from './vitrinaCapta.js'

test('la categoria elegida a mano gana sobre todo lo demas', () => {
  const id = categoriaDeVitrina({
    captaCategoria: 'hamburgueseria',
    rubro: 'heladeria',
    businessType: 'panaderia',
    plantilla: 'gelato',
  })
  assert.equal(id, 'hamburgueseria')
})

test('sin eleccion a mano manda el rubro del panel', () => {
  assert.equal(categoriaDeVitrina({ rubro: 'heladeria', businessType: 'restaurant' }), 'heladeria')
})

test('un "restaurant" con plantilla de pizzeria es una pizzeria', () => {
  assert.equal(categoriaDeVitrina({ businessType: 'restaurant', plantilla: 'pizzeria' }), 'pizzeria')
  assert.equal(categoriaDeVitrina({ businessType: 'restaurant', plantilla: 'burger' }), 'hamburgueseria')
})

test('lo que no se puede adivinar es una casa de comida', () => {
  assert.equal(categoriaDeVitrina({ businessType: 'restaurant' }), 'comida')
  assert.equal(categoriaDeVitrina({}), 'comida')
  assert.equal(nombreDeCategoria('comida'), 'Casa de comida')
  assert.equal(nombreDeCategoria('comida', { plural: true }), 'Casas de comida')
})

test('se muestra el local que reparte con Capta y tiene menu', () => {
  const local = { horarios: { _settings: { deliveryCapta: true } } }
  assert.equal(localVisibleEnVitrina(local, { conMenu: true }), true)
})

test('no se muestra el local sin Capta, el apagado a mano ni el que no tiene menu', () => {
  assert.equal(localVisibleEnVitrina({ horarios: { _settings: {} } }, { conMenu: true }), false)
  assert.equal(
    localVisibleEnVitrina(
      { horarios: { _settings: { deliveryCapta: true, captaVitrina: false } } },
      { conMenu: true },
    ),
    false,
  )
  assert.equal(
    localVisibleEnVitrina({ horarios: { _settings: { deliveryCapta: true } } }, { conMenu: false }),
    false,
  )
})

test('el delivery propio apagado no lo esconde: reparte Capta (Racing)', () => {
  assert.equal(
    localVisibleEnVitrina(
      { hace_delivery: false, horarios: { _settings: { deliveryCapta: true } } },
      { conMenu: true },
    ),
    true,
  )
})

test('el tiempo de entrega queda corto y parejo', () => {
  assert.equal(tiempoDeEntrega('45 minutos'), '45 min')
  assert.equal(tiempoDeEntrega('20 a 30 min'), '20-30 min')
  assert.equal(tiempoDeEntrega(''), '')
  assert.equal(tiempoDeEntrega('enseguida'), '')
})

test('el envio desde es la zona activa mas barata', () => {
  const zonas = [
    { fee: 3000, active: true },
    { fee: 2000, active: true },
    { fee: 500, active: false },
    { fee: 0, active: true },
  ]
  assert.equal(envioDesde(zonas), 2000)
  assert.equal(envioDesde([]), null)
  assert.equal(envioDesde(null), null)
})

test('la busqueda no distingue acentos ni mayusculas', () => {
  const local = { nombre: 'Heladería Troka', categoriaNombre: 'Heladeria', ciudad: 'Chivilcoy' }
  assert.equal(localCoincideCon(local, 'troka'), true)
  assert.equal(localCoincideCon(local, 'HELADERIA'), true)
  assert.equal(localCoincideCon(local, 'chivilcoy'), true)
  assert.equal(localCoincideCon(local, 'pizza'), false)
  assert.equal(localCoincideCon(local, ''), true)
  assert.equal(ciudadPareja(' Chivilcoy '), 'chivilcoy')
})

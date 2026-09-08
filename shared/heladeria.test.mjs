import test from 'node:test'
import assert from 'node:assert/strict'

import {
  configuracionDeHeladeria,
  saboresAgrupados,
  selloDeTamano,
  topeDeSabores,
  topePorNombre,
} from './heladeria.js'

test('el tope por defecto sale del peso, este escrito como este', () => {
  assert.equal(topePorNombre('1 Kilo'), 5)
  assert.equal(topePorNombre('1K'), 5)
  assert.equal(topePorNombre('1kg'), 5)
  assert.equal(topePorNombre('Un kilo'), 5)
  assert.equal(topePorNombre('3/4 Kilo'), 4)
  assert.equal(topePorNombre('1/2 Kilo'), 3)
  assert.equal(topePorNombre('Medio kilo'), 3)
  assert.equal(topePorNombre('500 g'), 3)
  assert.equal(topePorNombre('1/4'), 2)
  assert.equal(topePorNombre('250g'), 2)
})

test('el cucurucho y el vaso no son potes', () => {
  assert.equal(topePorNombre('Cucurucho'), 2)
  assert.equal(topePorNombre('Vaso helado'), 2)
  assert.equal(topePorNombre('Copa'), 2)
})

test('un envase con nombre raro cae en el tope generico', () => {
  assert.equal(topePorNombre('Pote familiar'), 3)
  assert.equal(topePorNombre(''), 3)
  assert.equal(topePorNombre(null), 3)
})

test('lo que configura el local le gana al nombre', () => {
  const config = configuracionDeHeladeria({
    heladeria: { topes: [{ id: 'p1', maximo: 8 }] },
  })
  assert.equal(topeDeSabores({ id: 'p1', name: '1/4 Kilo' }, config), 8)
  assert.equal(topeDeSabores({ id: 'p2', name: '1/4 Kilo' }, config), 2)
})

test('un tope mal cargado no rompe el menu: vale el del nombre', () => {
  const config = configuracionDeHeladeria({
    heladeria: {
      topes: [
        { id: 'p1', maximo: 0 },
        { id: 'p2', maximo: 'muchos' },
        { id: '', maximo: 4 },
      ],
    },
  })
  assert.equal(topeDeSabores({ id: 'p1', name: '1 Kilo' }, config), 5)
  assert.equal(topeDeSabores({ id: 'p2', name: '1/2 Kilo' }, config), 3)
})

test('la configuracion aguanta basura sin explotar', () => {
  for (const theme of [null, undefined, {}, { heladeria: 'si' }, { heladeria: [] }]) {
    const config = configuracionDeHeladeria(theme)
    assert.equal(config.topes.size, 0)
    assert.deepEqual(config.grupos, [])
    assert.equal(topeDeSabores({ id: 'x', name: '1 Kilo' }, config), 5)
  }
})

test('el sello se pega al tamano que eligio el local', () => {
  const config = configuracionDeHeladeria({
    heladeria: { destacado: { id: 'p2', texto: 'Mas pedido' } },
  })
  assert.equal(selloDeTamano({ id: 'p2', name: '1/2 Kilo' }, config), 'Mas pedido')
  assert.equal(selloDeTamano({ id: 'p1', name: '1 Kilo' }, config), null)
})

test('sin texto propio el sello dice "Mas elegido"', () => {
  const config = configuracionDeHeladeria({ heladeria: { destacado: { id: 'p1' } } })
  assert.equal(selloDeTamano({ id: 'p1', name: '1 Kilo' }, config), 'Más elegido')
})

test('los locales que ya tenian el sello por nombre siguen andando', () => {
  const config = configuracionDeHeladeria({ tamanoDestacado: '1/2 Kilo' })
  assert.equal(selloDeTamano({ id: 'p2', name: '1/2 KILO' }, config), 'Más elegido')
  assert.equal(selloDeTamano({ id: 'p1', name: '1 Kilo' }, config), null)
})

test('sin destacado ningun tamano lleva sello', () => {
  const config = configuracionDeHeladeria({})
  assert.equal(selloDeTamano({ id: 'p1', name: '1 Kilo' }, config), null)
})

const SABORES = [
  { id: 's1', name: 'Chocolate amargo' },
  { id: 's2', name: 'Limón' },
  { id: 's3', name: 'Dulce de leche' },
]

test('los grupos del local mandan y respetan su orden', () => {
  const config = configuracionDeHeladeria({
    heladeria: {
      grupos: [
        { nombre: 'Cremas', sabores: ['s3'] },
        { nombre: 'Chocolates', sabores: ['s1'] },
      ],
    },
  })
  const { sabores, chips } = saboresAgrupados(SABORES, config)
  assert.deepEqual(chips, ['Todos', 'Cremas', 'Chocolates', 'Otros'])
  assert.equal(sabores.find((s) => s.id === 's1').flavorCategory, 'Chocolates')
  assert.equal(sabores.find((s) => s.id === 's3').flavorCategory, 'Cremas')
})

test('el sabor que quedo sin grupo se puede encontrar en "Otros"', () => {
  const config = configuracionDeHeladeria({
    heladeria: { grupos: [{ nombre: 'Cremas', sabores: ['s3'] }] },
  })
  const { sabores, chips } = saboresAgrupados(SABORES, config)
  assert.deepEqual(chips, ['Todos', 'Cremas', 'Otros'])
  assert.equal(sabores.find((s) => s.id === 's2').flavorCategory, 'Otros')
})

test('un grupo vacio no dibuja un chip que lleva a una pantalla en blanco', () => {
  const config = configuracionDeHeladeria({
    heladeria: {
      grupos: [
        { nombre: 'Cremas', sabores: ['s3'] },
        { nombre: 'Sin TACC', sabores: [] },
        { nombre: 'Chocolates', sabores: ['s1', 's2'] },
      ],
    },
  })
  const { chips } = saboresAgrupados(SABORES, config)
  assert.deepEqual(chips, ['Todos', 'Cremas', 'Chocolates'])
})

test('con un solo grupo no se dibujan chips', () => {
  const config = configuracionDeHeladeria({
    heladeria: { grupos: [{ nombre: 'Todos los gustos', sabores: ['s1', 's2', 's3'] }] },
  })
  const { chips } = saboresAgrupados(SABORES, config)
  assert.deepEqual(chips, [])
})

test('sin grupos configurados se agrupa por nombre y solo salen los que existen', () => {
  const config = configuracionDeHeladeria({})
  const { chips, sabores } = saboresAgrupados(
    [
      { id: 's1', name: 'Chocolate suizo' },
      { id: 's2', name: 'Chocolate amargo' },
    ],
    config,
  )
  assert.deepEqual(chips, [])
  assert.equal(sabores[0].flavorCategory, 'Chocolate')

  const variados = saboresAgrupados(SABORES, config)
  assert.deepEqual(variados.chips, ['Todos', 'Frutales', 'Chocolate', 'Especiales'])
})

test('un grupo repetido no duplica el chip', () => {
  const config = configuracionDeHeladeria({
    heladeria: {
      grupos: [
        { nombre: 'Cremas', sabores: ['s3'] },
        { nombre: 'cremas', sabores: ['s1'] },
      ],
    },
  })
  assert.equal(config.grupos.length, 1)
  const { sabores } = saboresAgrupados(SABORES, config)
  assert.equal(sabores.find((s) => s.id === 's1').flavorCategory, 'Otros')
})

test('sin sabores no hay chips', () => {
  assert.deepEqual(saboresAgrupados([], configuracionDeHeladeria({})).chips, [])
  assert.deepEqual(saboresAgrupados(null, configuracionDeHeladeria({})).chips, [])
})

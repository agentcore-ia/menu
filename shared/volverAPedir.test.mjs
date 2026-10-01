import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  guardarUltimoPedido,
  leerUltimosPedidos,
  rearmarCarrito,
  resumenDelPedido,
  ultimoPedidoDe,
} from './volverAPedir.js'

function almacen() {
  const datos = new Map()
  return { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, String(v)) }
}

const pedidoTroka = {
  slug: 'troka',
  nombre: 'Troka',
  lineas: [
    { id: 'h1', nombre: 'Hamburguesa doble', cantidad: 2, unitPrice: 9500, base: 9000, notes: 'Extra cheddar' },
    { id: 'p1', nombre: 'Papas', cantidad: 1, unitPrice: 4000, base: 4000, notes: '' },
  ],
}

test('queda el ultimo pedido de cada local, el mas nuevo primero', () => {
  const a = almacen()
  guardarUltimoPedido(a, pedidoTroka, 1000)
  guardarUltimoPedido(a, { slug: 'babson', nombre: 'Babson', lineas: [{ id: 'x', nombre: 'Muzza', cantidad: 1 }] }, 2000)
  guardarUltimoPedido(a, { ...pedidoTroka, lineas: [pedidoTroka.lineas[1]] }, 3000)
  const lista = leerUltimosPedidos(a, 4000)
  assert.deepEqual(lista.map((p) => p.slug), ['troka', 'babson'])
  assert.equal(lista[0].lineas.length, 1)
  assert.equal(ultimoPedidoDe(a, 'babson', 4000).nombre, 'Babson')
})

test('un pedido de hace mas de dos meses ya no se ofrece', () => {
  const a = almacen()
  guardarUltimoPedido(a, pedidoTroka, 0)
  assert.equal(leerUltimosPedidos(a, 61 * 24 * 3600 * 1000).length, 0)
})

test('sin almacenamiento no rompe nada', () => {
  guardarUltimoPedido(null, pedidoTroka)
  assert.deepEqual(leerUltimosPedidos(null), [])
  const roto = { getItem: () => '{no es json', setItem: () => { throw new Error('lleno') } }
  assert.deepEqual(leerUltimosPedidos(roto), [])
  guardarUltimoPedido(roto, pedidoTroka)
})

test('el resumen dice lo principal', () => {
  assert.equal(resumenDelPedido(pedidoTroka), '2× Hamburguesa doble, 1× Papas')
  assert.equal(resumenDelPedido(pedidoTroka, 1), '2× Hamburguesa doble y 1 más')
})

test('el carrito se rearma con el precio de hoy y sin lo que ya no hay', () => {
  const items = [
    { id: 'h1', name: 'Hamburguesa doble', price: 10000 }, // subio 1000
    { id: 'p1', name: 'Papas', price: 4500, availableForOrder: false }, // sin stock
  ]
  const { lineas, faltan } = rearmarCarrito(pedidoTroka, items, (i) => i.price)
  assert.equal(lineas.length, 1)
  // 9500 (con extra) + 1000 que subio el producto = 10500.
  assert.equal(lineas[0].unitPrice, 10500)
  assert.equal(lineas[0].cantidad, 2)
  assert.equal(lineas[0].notes, 'Extra cheddar')
  assert.deepEqual(faltan, ['Papas'])
})

test('un producto que ya no esta en el menu se avisa, y el tope de stock se respeta', () => {
  const items = [{ id: 'h1', name: 'Hamburguesa doble', price: 9000, maxQuantity: 1 }]
  const { lineas, faltan } = rearmarCarrito(pedidoTroka, items, (i) => i.price)
  assert.equal(lineas[0].cantidad, 1)
  assert.deepEqual(faltan, ['Papas'])
})

test('sin opciones manda el precio de hoy aunque se haya guardado otro', () => {
  const pedido = { lineas: [{ id: 'p1', nombre: 'Papas', cantidad: 1, unitPrice: 3000, base: 3000, notes: '' }] }
  const { lineas } = rearmarCarrito(pedido, [{ id: 'p1', name: 'Papas', price: 4500 }], (i) => i.price)
  assert.equal(lineas[0].unitPrice, 4500)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buscarProductos, coincideConElRubro, palabrasDeLaBusqueda, puntajeDelProducto } from './busquedaProductos.js'

const productos = [
  { id: 1, restaurant_id: 'bruder', name: 'Pizza Muzzarella', category: 'Pizzas', price: 9000 },
  { id: 2, restaurant_id: 'chicha', name: 'Pizza Napolitana', category: 'Pizzas', price: 11000 },
  { id: 3, restaurant_id: 'racing', name: 'Milanesa a la pizza', category: 'Milanesas', price: 12000 },
  { id: 4, restaurant_id: 'troka', name: 'Helado de dulce de leche', category: 'Helados', description: 'Con pizzas de chocolate' , price: 5000 },
  { id: 5, restaurant_id: 'cian', name: 'Empanada de carne', category: 'Empanadas', price: 1900 },
  { id: 6, restaurant_id: 'cian', name: 'Árabe', category: 'Empanadas', price: 1900 },
]

test('las palabras se limpian: sin acentos, sin plural, sin "de"', () => {
  assert.deepEqual(palabrasDeLaBusqueda('Pizzas'), ['pizza'])
  assert.deepEqual(palabrasDeLaBusqueda('empanadas de CARNE'), ['empanada', 'carne'])
  assert.deepEqual(palabrasDeLaBusqueda('hamburguesas'), ['hamburguesa'])
  assert.deepEqual(palabrasDeLaBusqueda('árabe'), ['arabe'])
})

test('"pizza" trae las pizzas de distintos locales, primero las que se llaman pizza', () => {
  const r = buscarProductos(productos, 'pizzas')
  assert.deepEqual(r.map((p) => p.id), [1, 2, 3, 4])
  assert.deepEqual(new Set(r.slice(0, 2).map((p) => p.restaurant_id)), new Set(['bruder', 'chicha']))
})

test('todas las palabras tienen que estar', () => {
  assert.deepEqual(buscarProductos(productos, 'empanada carne').map((p) => p.id), [5])
  assert.deepEqual(buscarProductos(productos, 'empanada pollo'), [])
})

test('busca por categoria y sin tildes', () => {
  assert.deepEqual(buscarProductos(productos, 'arabe').map((p) => p.id), [6])
  assert.deepEqual(buscarProductos(productos, 'helados').map((p) => p.id), [4])
})

test('con buen puntaje igual, primero los locales abiertos', () => {
  const r = buscarProductos(productos, 'pizza', { abierto: (p) => p.restaurant_id === 'chicha' })
  assert.equal(r[0].id, 2)
})

test('tope por local para que se vean varias opciones', () => {
  const muchos = Array.from({ length: 10 }, (_, i) => ({ id: i, restaurant_id: 'a', name: `Pizza ${i}`, price: i }))
  assert.equal(buscarProductos([...muchos, productos[1]], 'pizza', { porLocal: 3 }).length, 4)
})

test('menos de 2 letras no busca', () => {
  assert.deepEqual(buscarProductos(productos, 'p'), [])
  assert.equal(puntajeDelProducto(productos[0], []), 0)
})

const heladeria = [
  { id: 'k1', restaurant_id: 'troka', name: '1 Kilo', category: 'Formato', price: 18000 },
  { id: 'k2', restaurant_id: 'troka', name: '1/4 Kilo', category: 'Formato', price: 6800 },
  { id: 'k3', restaurant_id: 'troka', name: 'Agua mineral', category: 'Bebidas', price: 1500 },
  { id: 'p1', restaurant_id: 'bruder', name: 'Coca Cola 1,5 L', category: 'Bebidas', price: 4000 },
  { id: 'p2', restaurant_id: 'bruder', name: 'Muzzarella', category: 'Pizzas', price: 9000 },
]
const rubros = { troka: 'heladeria', bruder: 'pizzeria', chicha: 'heladeria' }
const rubro = (p) => rubros[p.restaurant_id]

test('"helado" trae los productos de la heladeria aunque se llamen "1 Kilo", sin las bebidas', () => {
  const r = buscarProductos(heladeria, 'helados', { rubro })
  assert.deepEqual(r.map((p) => p.id), ['k1', 'k2'])
})

test('lo que tiene la palabra en el nombre va antes que lo que entra por el rubro', () => {
  const conChicha = [...heladeria, { id: 'c1', restaurant_id: 'chicha', name: 'Bochas de helado', category: 'Postres', price: 5000 }]
  const r = buscarProductos(conChicha, 'helado', { rubro })
  assert.equal(r[0].id, 'c1')
  assert.deepEqual(r.slice(1).map((p) => p.id), ['k1', 'k2'])
})

test('el rubro no mete productos de un local que ya tiene lo buscado', () => {
  // La pizzeria tiene "Pizzas" en la categoria: no se suma la gaseosa por el rubro.
  assert.deepEqual(buscarProductos(heladeria, 'pizza', { rubro }).map((p) => p.id), ['p2'])
})

test('el rubro se entiende con el plural y con el nombre del rubro', () => {
  assert.equal(coincideConElRubro('heladeria', palabrasDeLaBusqueda('heladería')), true)
  assert.equal(coincideConElRubro('licoreria', palabrasDeLaBusqueda('cervezas')), true)
  assert.equal(coincideConElRubro('heladeria', palabrasDeLaBusqueda('pizza')), false)
})

test('en una licoreria las bebidas si aparecen por el rubro', () => {
  const lico = [{ id: 'v1', restaurant_id: 'lico', name: 'Fernet Branca 750', category: 'Aperitivos', price: 12000 }, { id: 'v2', restaurant_id: 'lico', name: 'Coca Cola 2,25', category: 'Gaseosas', price: 4000 }]
  const r = buscarProductos(lico, 'bebidas', { rubro: () => 'licoreria' })
  assert.deepEqual(r.map((p) => p.id), ['v1', 'v2'])
})

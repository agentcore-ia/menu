// Los mandados de Capta Delivery: que se acepta y que lee el repartidor.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  esLocalDeMandados,
  nombreDelItem,
  normalizarMandado,
  notasDelMandado,
  TOPE_COMPRA_POR_DEFECTO,
  topeDeCompra,
} from './mandados.js'

test('el local de mandados se marca a mano en sus ajustes', () => {
  assert.equal(esLocalDeMandados({ _settings: { captaMandados: true } }), true)
  assert.equal(esLocalDeMandados({ _settings: { captaMandados: 'true' } }), false)
  assert.equal(esLocalDeMandados({ _settings: {} }), false)
  assert.equal(esLocalDeMandados(null), false)
  assert.equal(esLocalDeMandados([]), false)
})

test('el tope de compra sale del local, y si no hay uno valido es el de siempre', () => {
  assert.equal(topeDeCompra({ _settings: { mandadoTopeCompra: 50000 } }), 50000)
  assert.equal(topeDeCompra({ _settings: { mandadoTopeCompra: 0 } }), TOPE_COMPRA_POR_DEFECTO)
  assert.equal(topeDeCompra({ _settings: { mandadoTopeCompra: 'mucho' } }), TOPE_COMPRA_POR_DEFECTO)
  assert.equal(topeDeCompra(null), TOPE_COMPRA_POR_DEFECTO)
})

test('una compra necesita que comprar y cuanto puede salir', () => {
  assert.equal(normalizarMandado({ tipo: 'compra', que: '', tope: 5000 }).ok, false)
  assert.equal(normalizarMandado({ tipo: 'compra', que: 'un cargador', tope: '' }).ok, false)
  assert.equal(normalizarMandado({ tipo: 'compra', que: 'un cargador', tope: -10 }).ok, false)

  const r = normalizarMandado({ tipo: 'compra', que: '  un cargador   tipo C ', donde: '', tope: '8000.4' })
  assert.deepEqual(r, { ok: true, mandado: { tipo: 'compra', que: 'un cargador tipo C', donde: '', tope: 8000 } })
})

test('una compra no puede pasarse del tope: es plata del repartidor', () => {
  const r = normalizarMandado({ tipo: 'compra', que: 'una tele', tope: 900000 }, { tope: 30000 })
  assert.equal(r.ok, false)
  assert.match(r.mensaje, /30\.000/)
})

test('un paquete necesita donde retirarlo', () => {
  assert.equal(normalizarMandado({ tipo: 'paquete', que: 'unas llaves', donde: '' }).ok, false)

  const r = normalizarMandado({ tipo: 'paquete', que: 'unas llaves', donde: 'Moreno 123', contacto: 'Ana', pagaEn: 'retiro' })
  assert.deepEqual(r, {
    ok: true,
    mandado: { tipo: 'paquete', que: 'unas llaves', donde: 'Moreno 123', contacto: 'Ana', pagaEn: 'retiro' },
  })
  // Lo que no es "retiro" se cobra al entregar, que es lo normal.
  assert.equal(normalizarMandado({ tipo: 'paquete', que: 'llaves', donde: 'Moreno 123', pagaEn: 'x' }).mandado.pagaEn, 'entrega')
})

test('sin tipo, o con uno inventado, no se acepta', () => {
  assert.equal(normalizarMandado(null).ok, false)
  assert.equal(normalizarMandado({ tipo: 'tramite', que: 'pagar la luz' }).ok, false)
})

test('los textos largos se cortan en vez de romper el pedido', () => {
  const r = normalizarMandado({ tipo: 'compra', que: 'a'.repeat(2000), tope: 1000 })
  assert.equal(r.mandado.que.length, 500)
})

test('lo que lee el repartidor dice que adelanta y que cobra aparte', () => {
  const compra = normalizarMandado({ tipo: 'compra', que: 'pañales talle G', donde: 'Farmacia Central', tope: 25000 }).mandado
  const notas = notasDelMandado(compra)
  assert.match(notas, /MANDADO - COMPRA/)
  assert.match(notas, /pañales talle G/)
  assert.match(notas, /Farmacia Central/)
  assert.match(notas, /Adelantás hasta \$25\.000/)
  assert.match(notas, /cobrás el ticket/)
  assert.equal(nombreDelItem(compra), 'Mandado: comprar pañales talle G')

  const sinLugar = notasDelMandado({ ...compra, donde: '' })
  assert.match(sinLugar, /donde convenga/)
})

test('en un paquete dice donde retirar y cuando se cobra', () => {
  const paquete = normalizarMandado({ tipo: 'paquete', que: 'unas llaves', donde: 'Moreno 123', contacto: 'Ana 2346 111111' }).mandado
  const notas = notasDelMandado(paquete)
  assert.match(notas, /Retirar en: Moreno 123 \(Ana 2346 111111\)/)
  assert.match(notas, /se cobra al entregar/)
  assert.equal(nombreDelItem(paquete), 'Mandado: llevar unas llaves')
})

test('al cliente se le dice como paga, no lo que tiene que hacer el repartidor', async () => {
  const { avisoAlCliente } = await import('./mandados.js')
  const compra = { tipo: 'compra', que: 'pañales', donde: '', tope: 25000 }
  assert.match(avisoAlCliente(compra), /Pagás al recibir.*hasta \$25\.000.*envío/)
  assert.doesNotMatch(avisoAlCliente(compra), /Adelantás/)
  assert.match(avisoAlCliente({ tipo: 'paquete', que: 'llaves', donde: 'Moreno 123', pagaEn: 'retiro' }), /al retirar/)
})

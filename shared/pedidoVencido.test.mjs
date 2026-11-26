import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cerrarPedidosVencidos, pedidoVencido } from './pedidoVencido.js'
import { pedidoActivo } from '../server/pedidoActivo.js'

const AHORA = Date.parse('2026-11-26T20:00:00Z')
const haceHoras = (h) => new Date(AHORA - h * 3600 * 1000).toISOString()

test('un pedido vence pasados los dos dias', () => {
  assert.equal(pedidoVencido(haceHoras(1), AHORA), false)
  assert.equal(pedidoVencido(haceHoras(47), AHORA), false)
  assert.equal(pedidoVencido(haceHoras(49), AHORA), true)
  assert.equal(pedidoVencido(haceHoras(24 * 40), AHORA), true)
})

test('un pedido programado para mas adelante o sin fecha no vence', () => {
  assert.equal(pedidoVencido(haceHoras(-30), AHORA), false)
  for (const fecha of [undefined, null, '', 'ayer']) assert.equal(pedidoVencido(fecha, AHORA), false, String(fecha))
})

test('los viejos sin cerrar pasan a anteriores y el resto queda igual', () => {
  const [nuevo, viejo, entregado] = cerrarPedidosVencidos(
    [
      { numero: 1, terminado: false, estado: 'En camino', fecha: haceHoras(2) },
      { numero: 2, terminado: false, estado: 'En preparación', fecha: haceHoras(24 * 6) },
      { numero: 3, terminado: true, estado: 'Entregado', fecha: haceHoras(24 * 6) },
    ],
    AHORA,
  )
  assert.deepEqual([nuevo.terminado, nuevo.estado], [false, 'En camino'])
  assert.deepEqual([viejo.terminado, viejo.estado], [true, 'Finalizado'])
  assert.deepEqual([entregado.terminado, entregado.estado], [true, 'Entregado'])
  assert.deepEqual(cerrarPedidosVencidos(undefined), [])
})

// El servidor, para quien pidio sin cuenta (el seguimiento guardado en el telefono).
async function consultar(order) {
  const original = globalThis.fetch
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ order }) })
  try {
    const res = { codigo: 200, setHeader() {}, status(c) { this.codigo = c; return this }, json(d) { this.datos = d; return this } }
    await pedidoActivo({ method: 'GET', query: { token: '00000000-0000-4000-8000-000000000000' } }, res)
    return res.datos
  } finally {
    globalThis.fetch = original
  }
}

test('el seguimiento guardado de un pedido viejo se da por terminado', async () => {
  const viejo = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  assert.deepEqual(await consultar({ status: 'preparing', created_at: viejo, order_number: 7 }), { terminado: true })
  const reciente = await consultar({ status: 'preparing', created_at: new Date().toISOString(), order_number: 8 })
  assert.equal(reciente.estado, 'En preparación')
})

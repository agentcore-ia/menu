import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appHabilitada, esDominioDeLaApp, esPedidoDeLaApp } from './appCapta.js'
import { SupabaseOrderRepository } from '../server/repositories/supabaseOrderRepository.js'

test('solo un habilitado: true explicito abre los pedidos', () => {
  for (const v of [undefined, null, {}, { habilitado: false }, { habilitado: 'true' }, { habilitado: 1 }]) {
    assert.equal(appHabilitada(v), false, JSON.stringify(v))
  }
  assert.equal(appHabilitada({ habilitado: true }), true)
})

test('las direcciones de la app, sin confundirlas con las de los locales', () => {
  for (const h of ['capta.ar', 'CAPTA.AR', 'www.capta.ar', 'delivery.capta.ar', 'pedi.menu.net.ar', 'capta.ar:443', 'capta.ar.']) {
    assert.equal(esDominioDeLaApp(h), true, h)
  }
  for (const h of ['dolce.capta.ar', 'rollyva.capta.ar', 'deliverykiosco.capta.ar', 'menu.net.ar', 'localhost', 'otracapta.ar', '', undefined]) {
    assert.equal(esDominioDeLaApp(h), false, String(h))
  }
})

test('que pedidos son de la app', () => {
  assert.equal(esPedidoDeLaApp({ host: 'menu.net.ar', desdeVitrina: true }), true)
  assert.equal(esPedidoDeLaApp({ host: 'capta.ar', desdeVitrina: false }), true)
  assert.equal(esPedidoDeLaApp({ host: 'menu.net.ar', desdeVitrina: false }), false)
  assert.equal(esPedidoDeLaApp({ host: 'dolce.capta.ar' }), false)
  // El QR de una mesa es del local, aunque la direccion sea la de la app.
  assert.equal(esPedidoDeLaApp({ host: 'capta.ar', mesa: true }), false)
  assert.equal(esPedidoDeLaApp({}), false)
})

// El servidor del menu, con la base simulada.
function repositorio(filas) {
  const repo = Object.create(SupabaseOrderRepository.prototype)
  repo.consultas = []
  repo.request = async (ruta) => {
    repo.consultas.push(ruta)
    if (filas instanceof Error) throw filas
    return filas
  }
  repo.fetchRestaurant = async () => ({ id: 'r1', horarios: {} })
  return repo
}

test('el servidor: sin fila, con la fila apagada o sin base, la app esta cerrada', async () => {
  assert.equal(await repositorio([]).appTomaPedidos(), false)
  assert.equal(await repositorio([{ valor: { habilitado: false } }]).appTomaPedidos(), false)
  assert.equal(await repositorio(new Error('sin base')).appTomaPedidos(), false)
  assert.equal(await repositorio([{ valor: { habilitado: true } }]).appTomaPedidos(), true)
})

test('el servidor rechaza el pedido de la app mientras este cerrada', async () => {
  for (const payload of [{ desdeVitrina: true }, { hostDelPedido: 'capta.ar' }]) {
    await assert.rejects(
      () => repositorio([]).createOrder('dolce', payload),
      (e) => e.code === 'ORDER_TAKING_PAUSED' && e.statusCode === 409 && e.ordering.paused === true && /Muy pronto/.test(e.message),
    )
  }
})

test('el servidor no frena el menu propio del local ni la app ya habilitada', async () => {
  // Pasan el control y siguen hasta las validaciones de siempre: lo que falle despues no es el corte.
  const pasa = async (repo, payload) => {
    try {
      await repo.createOrder('dolce', payload)
    } catch (e) {
      assert.doesNotMatch(String(e.message), /Muy pronto/)
    }
  }
  const delLocal = repositorio([])
  await pasa(delLocal, { hostDelPedido: 'dolce.capta.ar' })
  assert.ok(!delLocal.consultas.some((c) => c.includes('capta_ajustes')), 'el menu del local ni consulta el ajuste')
  await pasa(repositorio([{ valor: { habilitado: true } }]), { desdeVitrina: true, hostDelPedido: 'capta.ar' })
})

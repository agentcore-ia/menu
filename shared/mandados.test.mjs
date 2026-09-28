// La validacion del formulario de mandados. Es la copia de la del dashboard
// (lib/mandadoCapta.ts): tiene que decir lo mismo que va a decir el servidor.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizarMandado, TIPOS_MANDADO } from './mandados.js'

test('hay dos tipos: comprar algo y llevar un paquete', () => {
  assert.deepEqual(TIPOS_MANDADO.map((t) => t.id), ['compra', 'paquete'])
})

test('una compra necesita que comprar y cuanto puede salir', () => {
  assert.equal(normalizarMandado({ tipo: 'compra', que: '', tope: 5000 }).ok, false)
  assert.equal(normalizarMandado({ tipo: 'compra', que: 'un cargador', tope: '' }).ok, false)
  assert.equal(normalizarMandado({ tipo: 'compra', que: 'un cargador', tope: -10 }).ok, false)

  const r = normalizarMandado({ tipo: 'compra', que: '  un cargador   tipo C ', donde: '', tope: '8000.4' })
  assert.deepEqual(r, { ok: true, mandado: { tipo: 'compra', que: 'un cargador tipo C', donde: '', tope: 8000 } })
})

test('una compra no puede pasarse del tope de la ciudad', () => {
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

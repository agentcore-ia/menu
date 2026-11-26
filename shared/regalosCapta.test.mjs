// Los regalos de Capta: puntos con condiciones, descuentos sobre productos y quien paga.
//
//   node --test shared/regalosCapta.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import { canjeConRegalos, canjePosible, configDePuntos } from './puntosCapta.js'
import { descuentoDelCupon, motivoNoAplica, textoDelCupon } from './cuponesCapta.js'

const config = configDePuntos({ activo: true, valor_del_punto: 2, minimo_para_canjear: 250, tope_por_pedido: 3000 })
const AHORA = Date.parse('2026-11-26T20:00:00Z')
const items = [
  { productId: 'pizza', unitPrice: 8000, quantity: 1 },
  { productId: 'gaseosa', unitPrice: 2000, quantity: 2 },
]
const pedido = (extra) => ({ puntos: 0, regalos: [], local: ['r1', 'troka'], items, comida: 12000, envio: 2500, ahora: AHORA, ...extra })
const regalo = (extra) => ({ id: 'b1', restantes: 500, locales: [], productos: [], paga: 'capta', venceAt: null, ...extra })

test('sin regalos da lo mismo que el canje de siempre', () => {
  for (const puntos of [0, 100, 250, 900, 5000]) {
    for (const comida of [1000, 12000, 90000]) {
      const antes = canjePosible({ puntos, comida, envio: 2500 }, config)
      const ahora = canjeConRegalos(pedido({ puntos, comida }), config)
      assert.deepEqual([ahora.pesos, ahora.puntos, ahora.pesosLocal], [antes.pesos, antes.puntos, 0], `${puntos} / ${comida}`)
    }
  }
})

test('un regalo de un local solo vale ahi, por su id o su direccion', () => {
  const r = regalo({ locales: ['r1'] })
  assert.equal(canjeConRegalos(pedido({ regalos: [r] }), config).pesos, 1000)
  assert.equal(canjeConRegalos(pedido({ regalos: [regalo({ locales: ['troka'] })] }), config).pesos, 1000)
  assert.equal(canjeConRegalos(pedido({ regalos: [r], local: ['r2', 'dolce'] }), config).pesos, 0)
})

test('los puntos de un producto no pasan de lo que cuesta ese producto', () => {
  const r = regalo({ restantes: 4000, productos: ['gaseosa'], paga: 'local' })
  const c = canjeConRegalos(pedido({ regalos: [r] }), config)
  assert.deepEqual([c.pesos, c.pesosLocal, c.pesosCapta], [4000, 4000, 0])
  assert.equal(canjeConRegalos(pedido({ regalos: [regalo({ productos: ['empanada'] })] }), config).pesos, 0)
})

test('lo que paga Capta no supera lo que gana; lo que paga el local no tiene ese tope', () => {
  const grande = { restantes: 100000 }
  assert.equal(canjeConRegalos(pedido({ regalos: [regalo(grande)] }), config).pesos, 3100, '5% de 12000 + 2500 de envio')
  assert.equal(canjeConRegalos(pedido({ regalos: [regalo({ ...grande, paga: 'local' })] }), config).pesos, 12000)
})

test('primero los regalos y despues el saldo comun, sin descontar mas que la comida', () => {
  const c = canjeConRegalos(pedido({ puntos: 5000, regalos: [regalo({ restantes: 5500, paga: 'local' })] }), config)
  assert.deepEqual([c.pesosLocal, c.comun.pesos, c.pesos], [11000, 1000, 12000])
})

test('un regalo chico se usa aunque no llegue al minimo, y aunque el programa este apagado', () => {
  const c = canjeConRegalos(pedido({ puntos: 100, regalos: [regalo({ restantes: 50 })] }), { ...config, activo: false })
  assert.deepEqual([c.pesos, c.comun.pesos, c.regalos.length], [100, 0, 1])
})

test('un regalo vencido o gastado no cuenta', () => {
  const lista = [regalo({ venceAt: '2026-11-01T00:00:00Z' }), regalo({ id: 'b2', restantes: 0 })]
  assert.equal(canjeConRegalos(pedido({ regalos: lista }), config).pesos, 0)
})

test('si pide usar menos, se guarda lo que sobra del regalo', () => {
  const lista = [regalo({ restantes: 500 })]
  const c = canjeConRegalos(pedido({ puntos: 1000, regalos: lista }), config, 400)
  assert.deepEqual([c.pesos, c.comun.pesos, c.regalos[0].puntos], [400, 0, 200])
  assert.equal(canjeConRegalos(pedido({ regalos: lista }), config, 0).pesos, 0)
})

test('descuento sobre productos elegidos: sale solo de lo que cuestan', () => {
  const diez = { tipo: 'porcentaje', valor: 10, producto_ids: ['gaseosa'], productos_nombre: 'Gaseosa', activo: true, max_usos_por_cliente: 1 }
  assert.equal(descuentoDelCupon(diez, { comida: 12000, envio: 2500, items }), 400)
  assert.equal(descuentoDelCupon({ ...diez, tipo: 'monto', valor: 9000 }, { comida: 12000, envio: 2500, items }), 4000)
  assert.equal(descuentoDelCupon({ ...diez, producto_ids: [] }, { comida: 12000, envio: 2500, items }), 1200)
  assert.equal(descuentoDelCupon({ ...diez, producto_ids: null }, { comida: 12000, envio: 2500, items }), 1200)
  assert.match(motivoNoAplica({ ...diez, producto_ids: ['empanada'] }, { comida: 12000, envio: 2500, items }), /agregá Gaseosa/)
  assert.equal(textoDelCupon(diez), '10% OFF en Gaseosa')
})

test('un regalo de puntos no se usa como codigo', () => {
  const p = { tipo: 'puntos', valor: 500, activo: true, max_usos_por_cliente: 1 }
  assert.match(motivoNoAplica(p, { comida: 12000, envio: 0, items }), /se suman a tu cuenta/)
  assert.equal(textoDelCupon(p), '500 puntos')
  assert.equal(descuentoDelCupon(p, { comida: 12000, envio: 0, items }), 0)
})

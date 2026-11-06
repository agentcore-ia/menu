import { test } from 'node:test'
import assert from 'node:assert/strict'
import { descuentoDelCupon, motivoNoAplica, textoDelCupon } from './cuponesCapta.js'

const gratis = { activo: true, tipo: 'producto', valor: 0, producto_id: 'p-1', producto_nombre: 'Gaseosa', restaurant_ids: ['este'], max_usos_por_cliente: 1, minimo_compra: 0 }

test('producto gratis: descuenta una unidad de ese producto, solo si esta en el pedido', () => {
  const items = [{ productId: 'p-2', unitPrice: 9000 }, { productId: 'p-1', unitPrice: 2500 }]
  assert.equal(descuentoDelCupon(gratis, { comida: 11500, envio: 2000, items }), 2500)
  assert.equal(descuentoDelCupon(gratis, { comida: 9000, envio: 2000, items: [items[0]] }), 0)
  assert.equal(descuentoDelCupon(gratis, { comida: 9000, envio: 2000 }), 0)
  assert.match(motivoNoAplica(gratis, { comida: 9000, envio: 2000, items: [items[0]], restaurantId: 'este' }) || '', /agregá Gaseosa/)
  assert.equal(motivoNoAplica(gratis, { comida: 11500, envio: 2000, items, restaurantId: 'este' }), null)
  assert.equal(textoDelCupon(gratis), 'Gaseosa gratis')
})

test('el tope y el total del pedido ponen techo al producto gratis', () => {
  const items = [{ productId: 'p-1', unitPrice: 2500 }]
  assert.equal(descuentoDelCupon({ ...gratis, tope_descuento: 2000 }, { comida: 2500, envio: 0, items }), 2000)
})

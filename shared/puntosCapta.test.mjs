// Los MISMOS casos que lib/puntosCaptaReglas.test.ts del dashboard: si las dos
// puntas no dan lo mismo, el checkout le ofrece al cliente un descuento que el
// servidor despues le rechaza.
//
//   node --test shared/puntosCapta.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canjeElegido, canjePosible, configDePuntos, enPesos, loQueGanaCapta, porQueNoEntraTodo,
} from './puntosCapta.js'

const config = (extra = {}) =>
  configDePuntos({ activo: true, pesos_por_punto: 100, valor_del_punto: 5, minimo_para_canjear: 200, tope_por_pedido: 3000, ...extra })

test('la config entra en las dos formas de escribirla', () => {
  assert.equal(config().valorDelPunto, 5)
  assert.equal(configDePuntos({ activo: true, valorDelPunto: 8 }).valorDelPunto, 8)
  assert.equal(configDePuntos(null).activo, false)
})

test('Capta nunca pone mas de lo que gana en ese pedido', () => {
  assert.equal(loQueGanaCapta(10000, 2700), 3200)

  const r = canjePosible({ puntos: 5000, comida: 10000, envio: 2700 }, config())
  assert.equal(r.pesos, 3000, 'manda el tope por pedido')
  assert.equal(r.motivo, 'tope_pedido')

  const sinTope = canjePosible({ puntos: 5000, comida: 10000, envio: 2700 }, config({ tope_por_pedido: 0 }))
  assert.equal(sinTope.pesos, 3200)
  assert.equal(sinTope.motivo, 'tope_capta')
})

test('hace falta el minimo y el programa prendido', () => {
  assert.equal(canjePosible({ puntos: 199, comida: 10000, envio: 2700 }, config()).motivo, 'sin_minimo')
  assert.equal(canjePosible({ puntos: 5000, comida: 10000, envio: 2700 }, config({ activo: false })).motivo, 'apagado')
  assert.equal(canjePosible({ puntos: 0, comida: 10000, envio: 2700 }, config()).motivo, 'sin_puntos')
})

test('el canje va en puntos enteros y no se lleva la comida gratis', () => {
  const r = canjePosible({ puntos: 301, comida: 6000, envio: 1200 }, config({ tope_por_pedido: 0 }))
  assert.equal(r.pesos, 1500)
  assert.equal(r.puntos, 300)

  const chico = canjePosible({ puntos: 100000, comida: 1000, envio: 9000 }, config({ minimo_para_canjear: 0, tope_por_pedido: 0 }))
  assert.equal(chico.pesos, 1000)
})

test('el cliente puede usar menos de lo que tiene', () => {
  assert.equal(canjeElegido({ puntos: 5000, comida: 10000, envio: 2700 }, 1000, config()).pesos, 1000)
  assert.equal(canjeElegido({ puntos: 5000, comida: 10000, envio: 2700 }, 999999, config()).pesos, 3000)
  assert.equal(canjeElegido({ puntos: 5000, comida: 10000, envio: 2700 }, 3, config()).pesos, 0)
})

test('los puntos se muestran en pesos', () => {
  assert.equal(enPesos(640, config()), 3200)
  assert.equal(enPesos(-5, config()), 0)
})

test('se puede explicar por que no entra todo', () => {
  assert.match(porQueNoEntraTodo('sin_minimo', config()), /200 puntos/)
  assert.match(porQueNoEntraTodo('tope_pedido', config()), /3.000/)
  assert.equal(porQueNoEntraTodo('', config()), '')
})

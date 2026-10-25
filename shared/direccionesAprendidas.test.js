import { test } from 'node:test'
import assert from 'node:assert/strict'

import { calleConNombre, claveDireccion, laMasCercana, partirCalleYAltura } from './direccionesAprendidas.js'

test('la clave es la misma que arma el panel', () => {
  assert.equal(claveDireccion('Av. 3 de Febrero 849', 'Chivilcoy'), 'av 3 de febrero 849|chivilcoy')
  assert.equal(claveDireccion('Güemes 100', ''), 'guemes 100')
})

test('una marcada sirve para la cuadra; "Calle 111" sola no', () => {
  assert.deepEqual(partirCalleYAltura('Calle 111 849'), { calle: 'calle 111', altura: 849 })
  assert.equal(calleConNombre(partirCalleYAltura('Calle 111').calle), false)
  const marcadas = [{ direccion: 'Calle 111 849' }]
  assert.equal(laMasCercana(marcadas, 900)?.direccion, 'Calle 111 849')
  assert.equal(laMasCercana(marcadas, 1100), null)
})

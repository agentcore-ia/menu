// Donde queda el local, si lo que tiene guardado es un punto de verdad.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { puntoDelLocal } from './ubicacionLocal.js'

test('sin ubicacion cargada (0,0 / null / vacio) no hay punto', () => {
  assert.equal(puntoDelLocal({ lat: 0, lng: 0 }), null)
  assert.equal(puntoDelLocal({ lat: null, lng: null }), null)
  assert.equal(puntoDelLocal({ lat: '', lng: '' }), null)
  assert.equal(puntoDelLocal(null), null)
})

test('un punto de Argentina vale; dado vuelta se acomoda; fuera del pais no', () => {
  assert.deepEqual(puntoDelLocal({ lat: -34.895, lng: -60.017 }), { lat: -34.895, lng: -60.017 })
  assert.deepEqual(puntoDelLocal({ lat: -60.017, lng: -34.895 }), { lat: -34.895, lng: -60.017 })
  assert.equal(puntoDelLocal({ lat: 40.4, lng: -3.7 }), null)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { cambiarCantidad, gruposConCantidades } from './opcionesCantidad.js'

const grupo = { id: 'variedades', kind: 'cantidades', cantidadPorSeleccion: {
  grupo: 'presentacion', opciones: { media: 6, docena: 12 },
} }

test('limita las unidades y permite repetir una variedad y corregirla', () => {
  for (const [presentacion, limite] of [['media', 6], ['docena', 12]]) {
    const [resuelto] = gruposConCantidades([grupo], { presentacion })
    assert.equal(resuelto.minSelect, limite)
    assert.equal(resuelto.maxSelect, limite)
    let elegidas = []
    for (let i = 0; i < limite + 2; i++) elegidas = cambiarCantidad(elegidas, 'Medialuna', 1, limite)
    assert.equal(elegidas.length, limite)
    elegidas = cambiarCantidad(elegidas, 'Medialuna', -1, limite)
    assert.equal(elegidas.length, limite - 1)
    elegidas = cambiarCantidad(elegidas, 'Vigilante', 1, limite)
    assert.equal(elegidas.filter((v) => v === 'Vigilante').length, 1)
  }
})

test('sin presentación no permite sumar y conserva los grupos comunes', () => {
  const comun = { id: 'otro', selection: 'single' }
  const grupos = gruposConCantidades([grupo, comun], {})
  assert.equal(grupos[0].cantidadObjetivo, 0)
  assert.deepEqual(cambiarCantidad([], 'Medialuna', 1, 0), [])
  assert.equal(grupos[1], comun)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { anguloParaGajo, gajoBajoLaFlecha, VUELTAS } from './ruleta.js'

test('la flecha siempre queda sobre el gajo que eligio el servidor', () => {
  for (let cantidad = 2; cantidad <= 10; cantidad += 1) {
    for (let i = 0; i < cantidad; i += 1) {
      for (const azar of [0, 0.25, 0.5, 0.75, 1]) {
        const grados = anguloParaGajo(i, cantidad, azar)
        assert.equal(gajoBajoLaFlecha(grados, cantidad), i, `${i} de ${cantidad} con ${azar}`)
        assert.ok(grados >= VUELTAS * 360, 'da varias vueltas antes de frenar')
      }
    }
  }
})

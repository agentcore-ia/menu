// node --test shared/celular.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { celularValido, normalizarCelular } from './celular.js'

test('como lo escribe la gente de Chivilcoy', () => {
  assert.equal(normalizarCelular('2346587122'), '5492346587122')
  assert.equal(normalizarCelular('2346 15 587122'), '5492346587122')
  assert.equal(normalizarCelular('02346-15-587122'), '5492346587122')
  assert.equal(normalizarCelular('+54 9 2346 587122'), '5492346587122')
  assert.equal(normalizarCelular('5492346587122'), '5492346587122')
})

test('otras caracteristicas', () => {
  assert.equal(normalizarCelular('11 15 4444 5555'), '5491144445555')
  assert.equal(normalizarCelular('221 15 4567890'), '5492214567890')
  assert.equal(normalizarCelular('15 4444 5555'), '5491144445555')
})

test('valido solo si queda un celular completo', () => {
  assert.equal(celularValido('2346587122'), true)
  assert.equal(celularValido('2346 15 587122'), true)
  // Sin caracteristica, cortos o basura: no.
  assert.equal(celularValido('587122'), false)
  assert.equal(celularValido('15587122'), false)
  assert.equal(celularValido('32232394'), false)
  assert.equal(celularValido(''), false)
  assert.equal(celularValido('menu-sin-telefono-troka-1789'), false)
})

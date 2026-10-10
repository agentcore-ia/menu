// node --test shared/direccionCandidatos.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  alturaDe, alturasVecinas, conLaAltura, direccionConAltura, palabrasDeCalle, soloLaCalleEscrita, esPuerta,
} from './direccionCandidatos.js'

test('lee la altura', () => {
  assert.equal(alturaDe('jose leon suarez 927'), 927)
  assert.equal(alturaDe('calle 88 275'), 275)
  assert.equal(alturaDe('Belgrano'), null)
})

test('alturas vecinas', () => {
  assert.deepEqual(alturasVecinas(900), [[898, 902, 890, 910], [850, 950, 800, 1000]])
  assert.deepEqual(alturasVecinas(30), [[28, 32, 20, 40], [80, 130]])
})

test('cambia la altura en la direccion y en la etiqueta', () => {
  assert.equal(direccionConAltura('av jose leon suarez 927', 927, 930), 'av jose leon suarez 930')
  assert.equal(conLaAltura('930, Avenida Jose Leon Suarez', 930, 927), '927, Avenida Jose Leon Suarez')
})

test('las palabras de la calle no llevan "av" ni numeros', () => {
  assert.deepEqual(palabrasDeCalle('Av. José León Suárez 927'), ['jose', 'leon', 'suarez'])
})

test('el caso real: "Acceso Eva Duarte" no es "jose leon suarez"', () => {
  const candidatos = [
    { id: 'a', label: 'Acceso Eva Duarte de Perón' },
    { id: 'b', label: 'Avenida José León Suárez' },
  ]
  assert.deepEqual(soloLaCalleEscrita(candidatos, 'jose leon suarez 927').map((c) => c.id), ['b'])
})

test('si ninguna nombra la calle (tipeo), quedan todas', () => {
  const candidatos = [{ id: 'a', label: 'Florentino Ameghino' }]
  assert.deepEqual(soloLaCalleEscrita(candidatos, 'ameginho 230').map((c) => c.id), ['a'])
})

test('puerta o calle', () => {
  assert.equal(esPuerta('house'), true)
  assert.equal(esPuerta('residential'), false)
})

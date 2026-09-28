// Si el local cobra por transferencia en el menu.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aceptaTransferencia, datosDeTransferencia } from './transferencia.js'

const babson = {
  transfer_payment_enabled: true,
  transfer_payment_alias: 'babson.mp',
  transfer_payment_cvu: null,
  transfer_payment_holder: 'BABSON ONWARD S.A',
  transfer_payment_bank: 'MERCADO PAGO',
  transfer_payment_instructions: null,
}

test('prendido y con alias: se ofrece con sus datos', () => {
  assert.deepEqual(datosDeTransferencia(babson), {
    alias: 'babson.mp', cvu: null, titular: 'BABSON ONWARD S.A', banco: 'MERCADO PAGO', instrucciones: null,
  })
  assert.equal(aceptaTransferencia(babson), true)
})

test('apagado NO se ofrece aunque el alias siga cargado', () => {
  // El caso de Babson: lo apago desde Ajustes y el menu lo seguia mostrando.
  const apagado = { ...babson, transfer_payment_enabled: false }
  assert.equal(datosDeTransferencia(apagado), null)
  assert.equal(aceptaTransferencia(apagado), false)
})

test('sin tocar el interruptor tampoco', () => {
  assert.equal(aceptaTransferencia({ ...babson, transfer_payment_enabled: null }), false)
  assert.equal(aceptaTransferencia({ ...babson, transfer_payment_enabled: undefined }), false)
})

test('prendido pero sin adonde transferir no se ofrece', () => {
  const vacio = { transfer_payment_enabled: true, transfer_payment_alias: '  ', transfer_payment_cvu: null }
  assert.equal(datosDeTransferencia(vacio), null)
})

test('con CBU/CVU y sin alias alcanza', () => {
  const r = datosDeTransferencia({ transfer_payment_enabled: true, transfer_payment_cvu: ' 0000003100012345678901 ' })
  assert.equal(r.cvu, '0000003100012345678901')
  assert.equal(r.alias, null)
})

test('sin local no rompe', () => {
  assert.equal(datosDeTransferencia(null), null)
  assert.equal(datosDeTransferencia(undefined), null)
})

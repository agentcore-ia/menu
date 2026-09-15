// La ubicacion que marca el cliente en el mapa del menu.
//
//   node --test shared/ubicacionCliente.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  direccionDeGoogle,
  direccionDeNominatim,
  puntoValido,
  ubicacionParaPedido,
} from './ubicacionCliente.js'

test('un punto de Chivilcoy vale y se redondea a 6 decimales', () => {
  assert.deepEqual(puntoValido({ lat: -34.89481234567, lng: '-60.0065' }), { lat: -34.894812, lng: -60.0065 })
  assert.deepEqual(puntoValido({ lat: -34.9, lon: -60.01 }), { lat: -34.9, lng: -60.01 })
})

test('el 0,0 de un GPS sin señal, lo vacio y lo imposible no valen', () => {
  assert.equal(puntoValido({ lat: 0, lng: 0 }), null)
  assert.equal(puntoValido({ lat: null, lng: -60 }), null)
  assert.equal(puntoValido({ lat: '', lng: -60 }), null)
  assert.equal(puntoValido({ lat: 'abc', lng: -60 }), null)
  assert.equal(puntoValido({ lat: -95, lng: -60 }), null)
  assert.equal(puntoValido({ lat: -34, lng: 200 }), null)
  assert.equal(puntoValido(null), null)
})

test('Google: calle y altura, sin partido ni provincia', () => {
  const r = direccionDeGoogle({
    formatted_address: 'Juana Manso 222, B6620 Chivilcoy, Provincia de Buenos Aires, Argentina',
    address_components: [
      { long_name: '222', types: ['street_number'] },
      { long_name: 'Juana Manso', types: ['route'] },
      { long_name: 'Chivilcoy', types: ['locality', 'political'] },
    ],
  })
  assert.equal(r.direccion, 'Juana Manso 222')
  assert.match(r.etiqueta, /Chivilcoy/)
})

test('Google sin altura: queda la calle sola', () => {
  const r = direccionDeGoogle({ formatted_address: 'Ruta 5', address_components: [{ long_name: 'Ruta 5', types: ['route'] }] })
  assert.equal(r.direccion, 'Ruta 5')
})

test('Nominatim: calle y altura, y sin calle no inventa nada', () => {
  assert.deepEqual(
    direccionDeNominatim({ display_name: '222, Juana Manso, Chivilcoy', address: { road: 'Juana Manso', house_number: '222' } }),
    { direccion: 'Juana Manso 222', etiqueta: '222, Juana Manso, Chivilcoy' },
  )
  assert.equal(direccionDeNominatim({ display_name: 'Parque', address: {} }).direccion, '')
  assert.equal(direccionDeNominatim(null).direccion, '')
})

test('lo que viaja en el pedido: punto, precision redondeada y fuente', () => {
  assert.deepEqual(
    ubicacionParaPedido({ lat: -34.9, lng: -60.01, precision: 12.7, fuente: 'gps', label: 'x' }),
    { lat: -34.9, lng: -60.01, precision: 13, fuente: 'gps' },
  )
  assert.deepEqual(ubicacionParaPedido({ lat: -34.9, lng: -60.01, precision: null, fuente: 'otra' }), {
    lat: -34.9, lng: -60.01, precision: null, fuente: 'mapa',
  })
  assert.equal(ubicacionParaPedido({ lat: 0, lng: 0 }), null)
})

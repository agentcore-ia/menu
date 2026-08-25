// La libreta del cliente.
//
// Lo que se cuida es que un pedido nunca se rompa por esto: si no hay donde
// guardar, si lo guardado esta roto o vencido, el menu tiene que seguir
// funcionando como si la libreta no existiera.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  leerDatos,
  guardarDatos,
  olvidarDatos,
  prellenarFormulario,
  coordenadasGuardadas,
  hayDatosGuardados,
} from './datosDelCliente.js'

const DIA = 24 * 60 * 60 * 1000

function almacen(inicial = null) {
  const caja = { valor: inicial }
  return {
    getItem: () => caja.valor,
    setItem: (_clave, valor) => { caja.valor = String(valor) },
    removeItem: () => { caja.valor = null },
  }
}

/** Uno que no deja guardar nada: Safari en privado, cuota llena. */
function almacenRoto() {
  return {
    getItem: () => { throw new Error('bloqueado') },
    setItem: () => { throw new Error('bloqueado') },
    removeItem: () => { throw new Error('bloqueado') },
  }
}

const PEDIDO = {
  name: 'Matias',
  phone: '5492284123456',
  address: 'Guemes 123',
  neighborhood: 'Centro',
  deliveryType: 'delivery',
  paymentMethod: 'transferencia',
  notes: 'sin sal',
}

const BASE = {
  name: '',
  phone: '',
  address: '',
  neighborhood: '',
  city: '',
  deliveryType: 'delivery',
  paymentMethod: 'cash',
  notes: '',
}

test('lo que cargo en un pedido vuelve en el siguiente', () => {
  const s = almacen()
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria' })

  const form = prellenarFormulario(BASE, leerDatos(s))
  assert.equal(form.name, 'Matias')
  assert.equal(form.phone, '5492284123456')
  assert.equal(form.address, 'Guemes 123')
  assert.equal(form.neighborhood, 'Centro')
  assert.equal(form.paymentMethod, 'transferencia')
})

test('las notas del pedido NO se guardan', () => {
  // "sin sal" o "tocar timbre dos veces" es de ESE pedido, no del cliente.
  const s = almacen()
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria' })
  assert.equal(leerDatos(s).notes, undefined)
  assert.equal(prellenarFormulario(BASE, leerDatos(s)).notes, '')
})

test('sin nada guardado el formulario queda igual que siempre', () => {
  assert.deepEqual(prellenarFormulario(BASE, null), BASE)
  assert.deepEqual(prellenarFormulario(BASE, leerDatos(almacen())), BASE)
})

test('un pedido en la mesa no pisa la direccion de la casa', () => {
  const s = almacen()
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria' })
  guardarDatos(s, { ...BASE, name: 'Matias', phone: '5492284999999' }, { esMesa: true })

  const guardado = leerDatos(s)
  assert.equal(guardado.phone, '5492284999999', 'el celular nuevo si se actualiza')
  assert.equal(guardado.address, 'Guemes 123', 'la direccion sobrevive')
  assert.equal(guardado.deliveryType, 'delivery')
})

test('en la mesa el tipo de entrega lo manda el QR', () => {
  const s = almacen()
  guardarDatos(s, { ...PEDIDO, deliveryType: 'retiro' }, { ciudad: 'Olavarria' })
  const form = prellenarFormulario({ ...BASE, deliveryType: 'local' }, leerDatos(s), { esMesa: true })
  assert.equal(form.deliveryType, 'local')
  assert.equal(form.name, 'Matias', 'el nombre igual se completa')
})

test('la direccion confirmada vuelve con sus coordenadas', () => {
  const s = almacen()
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria', coordenadas: { lat: -36.89, lng: -60.32, label: 'Guemes 123' } })

  // Escrita distinto, mismo lugar: no hay que confirmarla de nuevo.
  assert.deepEqual(
    coordenadasGuardadas(leerDatos(s), { address: '  guemes   123 ', neighborhood: 'CENTRO' }, 'olavarria'),
    { lat: -36.89, lng: -60.32, label: 'Guemes 123' },
  )
})

test('las coordenadas no se reusan si cambio algo', () => {
  const s = almacen()
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria', coordenadas: { lat: -36.89, lng: -60.32 } })
  const guardado = leerDatos(s)

  assert.equal(coordenadasGuardadas(guardado, { address: 'Guemes 456', neighborhood: 'Centro' }, 'Olavarria'), null)
  assert.equal(coordenadasGuardadas(guardado, { address: 'Guemes 123', neighborhood: 'Norte' }, 'Olavarria'), null)
  // La misma calle en otra ciudad es otro lugar: cobrarle a un local de Tandil
  // el envio hasta un punto de Olavarria seria cobrar cualquier cosa.
  assert.equal(coordenadasGuardadas(guardado, { address: 'Guemes 123', neighborhood: 'Centro' }, 'Tandil'), null)
})

test('coordenadas imposibles se descartan', () => {
  const s = almacen()
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria', coordenadas: { lat: 999, lng: -60.3 } })
  assert.equal(leerDatos(s).coordenadas, null)

  const t = almacen()
  guardarDatos(t, PEDIDO, { ciudad: 'Olavarria', coordenadas: { lat: 'ahi nomas', lng: null } })
  assert.equal(leerDatos(t).coordenadas, null)
})

test('lo guardado vence al ano', () => {
  const s = almacen()
  const hace2anos = Date.now() - 730 * DIA
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria', ahora: hace2anos })

  assert.equal(leerDatos(s, hace2anos + DIA)?.name, 'Matias')
  assert.equal(leerDatos(s), null, 'dos anos despues ya no dice donde vive')
})

test('un reloj atrasado no vence nada', () => {
  // El telefono con la fecha mal puesta es un clasico: lo guardado queda "en
  // el futuro" y no por eso hay que tirarlo.
  const s = almacen()
  const ahora = Date.now()
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria', ahora })
  assert.equal(leerDatos(s, ahora - 30 * DIA)?.name, 'Matias')
})

test('basura guardada se ignora sin romper nada', () => {
  const basura = ['', 'no soy json', '{}', '[]', 'null', '{"v":99,"name":"Matias"}', '{"v":1,"name":"Matias"}']
  for (const crudo of basura) {
    assert.equal(leerDatos(almacen(crudo)), null, crudo)
  }
})

test('un guardado sin nada util es como no tener nada', () => {
  const s = almacen()
  assert.equal(guardarDatos(s, { ...BASE }), null)
  assert.equal(leerDatos(s), null)
})

test('sin lugar donde guardar el menu sigue andando', () => {
  const roto = almacenRoto()
  assert.equal(leerDatos(roto), null)
  assert.equal(guardarDatos(roto, PEDIDO, { ciudad: 'Olavarria' }), null)
  assert.doesNotThrow(() => olvidarDatos(roto))
  assert.equal(leerDatos(null), null)
  assert.equal(guardarDatos(null, PEDIDO), null)
})

test('borrar deja el telefono limpio', () => {
  const s = almacen()
  guardarDatos(s, PEDIDO, { ciudad: 'Olavarria' })
  assert.equal(hayDatosGuardados(leerDatos(s)), true)

  olvidarDatos(s)
  assert.equal(leerDatos(s), null)
  assert.equal(hayDatosGuardados(leerDatos(s)), false)
  assert.deepEqual(prellenarFormulario(BASE, leerDatos(s)), BASE)
})

test('no se guardan formas de pago ni entrega inventadas', () => {
  const s = almacen()
  guardarDatos(s, { ...PEDIDO, deliveryType: 'dron', paymentMethod: 'cripto' }, { ciudad: 'Olavarria' })
  const guardado = leerDatos(s)
  assert.equal(guardado.deliveryType, '')
  assert.equal(guardado.paymentMethod, '')

  // Y el formulario se queda con sus valores de siempre.
  const form = prellenarFormulario(BASE, guardado)
  assert.equal(form.deliveryType, 'delivery')
  assert.equal(form.paymentMethod, 'cash')
})

test('los textos se recortan: nadie tiene una novela como direccion', () => {
  const s = almacen()
  guardarDatos(s, { ...PEDIDO, address: 'a'.repeat(5000) }, { ciudad: 'Olavarria' })
  assert.equal(leerDatos(s).address.length, 160)
})

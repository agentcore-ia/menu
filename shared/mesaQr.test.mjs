import test from 'node:test'
import assert from 'node:assert/strict'
import {
  datosDelWifi, estadoDelLlamado, haceCuanto, mesaDelQr, motivoDeLlamado, motivoHabilitado, nombreDeMesa, notaLimpia, opcionesMesaQr,
  textoQrDelWifi,
} from './mesaQr.js'

test('sin nada guardado se muestra todo', () => {
  assert.deepEqual(opcionesMesaQr(undefined), {
    bienvenida: true, verMenu: true, llamarMozo: true, pedirCuenta: true, pagar: true, propina: true, wifi: false, resena: true,
  })
})

test('el Wi-Fi se muestra solo con la red cargada y el interruptor prendido', () => {
  assert.equal(opcionesMesaQr({ mesaWifi: { red: 'Totta Clientes', clave: 'pizza2026' } }).wifi, true)
  assert.equal(opcionesMesaQr({ mesaWifi: { red: '  ', clave: 'x' } }).wifi, false)
  assert.equal(opcionesMesaQr({ mesaQr: { wifi: false }, mesaWifi: { red: 'Totta' } }).wifi, false)
  assert.deepEqual(datosDelWifi({ mesaWifi: { red: ' Totta Clientes ', clave: 'pizza2026' } }), { red: 'Totta Clientes', clave: 'pizza2026', abierta: false })
  assert.deepEqual(datosDelWifi({ mesaWifi: { red: 'Libre' } }), { red: 'Libre', clave: '', abierta: true })
  assert.equal(datosDelWifi({}), null)
  // Solo el Wi-Fi a la vista alcanza: la pantalla no queda vacia.
  const soloWifi = opcionesMesaQr({ mesaQr: { verMenu: false, llamarMozo: false, pedirCuenta: false, pagar: false, resena: false }, mesaWifi: { red: 'Totta' } })
  assert.equal(soloWifi.verMenu, false)
})

test('el codigo QR del Wi-Fi escapa los simbolos', () => {
  assert.equal(textoQrDelWifi({ red: 'Totta Clientes', clave: 'pizza2026' }), 'WIFI:T:WPA;S:Totta Clientes;P:pizza2026;;')
  assert.equal(textoQrDelWifi({ red: 'Bar;Uno', clave: 'a:b,c"d\\e' }), 'WIFI:T:WPA;S:Bar\\;Uno;P:a\\:b\\,c\\"d\\\\e;;')
  assert.equal(textoQrDelWifi({ red: 'Libre', clave: '' }), 'WIFI:T:nopass;S:Libre;;')
  assert.equal(textoQrDelWifi(null), '')
})

test('lo que el local oculta, se oculta; lo demas queda', () => {
  const o = opcionesMesaQr({ mesaQr: { pagar: false, propina: false, llamarMozo: 'no' } })
  assert.equal(o.pagar, false)
  assert.equal(o.propina, false)
  assert.equal(o.llamarMozo, true, 'un valor que no es si/no no cuenta')
  assert.equal(o.verMenu, true)
})

test('las reseñas heredan el interruptor viejo hasta que se elija', () => {
  assert.equal(opcionesMesaQr({}, { feedback_enabled: false }).resena, false)
  assert.equal(opcionesMesaQr({ mesaQr: { resena: true } }, { feedback_enabled: false }).resena, true)
})

test('con todo oculto queda el menu: la pantalla no puede quedar vacia', () => {
  const o = opcionesMesaQr({ mesaQr: { verMenu: false, llamarMozo: false, pedirCuenta: false, pagar: false, resena: false } })
  assert.equal(o.verMenu, true)
})

test('motivos', () => {
  assert.equal(motivoDeLlamado('cuenta'), 'cuenta')
  assert.equal(motivoDeLlamado('cualquiera'), 'mozo')
  const o = opcionesMesaQr({ mesaQr: { pedirCuenta: false } })
  assert.equal(motivoHabilitado(o, 'mozo'), true)
  assert.equal(motivoHabilitado(o, 'cuenta'), false)
})

test('la nota queda en una linea, corta y sin simbolos de marcado', () => {
  assert.equal(notaLimpia('  traer\nhielo  <b> '), 'traer hielo b')
  assert.equal(notaLimpia(''), null)
  assert.equal(notaLimpia('x'.repeat(300)).length, 120)
})

test('nombre de la mesa', () => {
  assert.equal(nombreDeMesa('5'), 'Mesa 5')
  assert.equal(nombreDeMesa('mesa%205'), 'Mesa 5')
  assert.equal(nombreDeMesa('Mesa12'), 'Mesa 12')
  assert.equal(nombreDeMesa('Barra'), 'Barra')
  assert.equal(nombreDeMesa('  '), '')
  assert.equal(nombreDeMesa('7B'), 'Mesa 7B')
  assert.equal(nombreDeMesa('A1'), 'Mesa A1')
  assert.equal(nombreDeMesa('Mesada'), 'Mesada')
  assert.equal(nombreDeMesa('aaaaaaaa-1111-2222-3333-444444444444'), '', 'el identificador no es un nombre')
})

test('la mesa del QR entre las del salon', () => {
  const mesas = [{ id: 'aaaaaaaa-1111-2222-3333-444444444444', name: 'Mesa 5' }, { id: 'b', name: 'Barra' }]
  assert.equal(mesaDelQr(mesas, '5').name, 'Mesa 5')
  assert.equal(mesaDelQr(mesas, 'mesa%205').name, 'Mesa 5')
  assert.equal(mesaDelQr(mesas, 'barra').name, 'Barra')
  assert.equal(mesaDelQr(mesas, 'AAAAAAAA-1111-2222-3333-444444444444').name, 'Mesa 5')
  assert.equal(mesaDelQr(mesas, '9'), null)
  assert.equal(mesaDelQr(mesas, ''), null)
})

test('estado del llamado', () => {
  const ahora = Date.parse('2026-11-15T20:00:00Z')
  assert.equal(estadoDelLlamado(null, ahora), 'ninguno')
  assert.equal(estadoDelLlamado({ creado_at: '2026-11-15T19:55:00Z', atendido_at: null }, ahora), 'llamando')
  assert.equal(estadoDelLlamado({ creado_at: '2026-11-15T19:20:00Z', atendido_at: null }, ahora), 'vencido')
  assert.equal(estadoDelLlamado({ creado_at: '2026-11-15T19:55:00Z', atendido_at: '2026-11-15T19:56:00Z', atendido_por: 'Lucía' }, ahora), 'atendido')
  assert.equal(estadoDelLlamado({ creado_at: '2026-11-15T19:55:00Z', atendido_at: '2026-11-15T19:56:00Z', atendido_por: 'cliente' }, ahora), 'cancelado')
})

test('hace cuanto', () => {
  const ahora = Date.parse('2026-11-15T20:00:00Z')
  assert.equal(haceCuanto('2026-11-15T19:59:40Z', ahora), 'recién')
  assert.equal(haceCuanto('2026-11-15T19:58:00Z', ahora), 'hace 2 min')
})

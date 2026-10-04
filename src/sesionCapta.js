// La sesion del cliente en Capta Delivery: el token que devolvio el dashboard
// al verificar el codigo de WhatsApp, guardado en ESTE telefono. El token es
// la llave de la cuenta; el resto (nombre, celular) es para mostrar sin
// esperar al servidor.
import { almacenDelNavegador, guardarDatos } from '../shared/datosDelCliente.js'

const CLAVE = 'capta-sesion'

export function leerSesion() {
  try {
    const s = JSON.parse(almacenDelNavegador()?.getItem(CLAVE) || 'null')
    return s && /^[a-f0-9]{64}$/.test(String(s.token)) ? s : null
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  try {
    almacenDelNavegador()?.setItem(CLAVE, JSON.stringify(sesion))
  } catch {
    // Sin almacenamiento (modo privado): la cuenta dura lo que dure la pagina.
  }
  // Su nombre y su celular quedan para completar el pedido en cualquier menu.
  // esMesa: no toca la direccion que ya tenia guardada en este telefono.
  const c = sesion?.cliente
  if (c?.telefono) {
    guardarDatos(almacenDelNavegador(), { name: c.nombre || '', phone: c.telefono }, { esMesa: true })
  }
}

export function borrarSesion() {
  try {
    almacenDelNavegador()?.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
}

/** Habla con /api/delivery/cuenta. Devuelve los datos o tira el mensaje para el cliente. */
export async function pedirCuenta(metodo, cuerpo, token) {
  const respuesta = await fetch('/api/delivery/cuenta', {
    method: metodo,
    headers: {
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
    cache: 'no-store',
  })
  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    const error = new Error(datos?.message || 'No pudimos completar. Probá de nuevo.')
    error.status = respuesta.status
    error.esperarSegundos = datos?.esperarSegundos ?? null
    throw error
  }
  return datos
}

/** "5492346587122" -> "2346 58-7122" para mostrar. */
export function celularLindo(telefono) {
  const t = String(telefono || '').replace(/\D/g, '').replace(/^549/, '')
  if (t.length !== 10) return telefono || ''
  const cod = t.startsWith('11') ? 2 : t.startsWith('2') || t.startsWith('3') ? 4 : 3
  const resto = t.slice(cod)
  return `${t.slice(0, cod)} ${resto.slice(0, resto.length - 4)}-${resto.slice(-4)}`
}

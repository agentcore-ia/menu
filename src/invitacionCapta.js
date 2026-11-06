// La invitacion por la que llego el cliente a Capta Delivery (delivery.capta.ar/?invitacion=CODIGO).
//
// El link trae el codigo. Se guarda en este telefono hasta que crea su cuenta: si abre el link, mira la app
// y se registra mas tarde, igual recibe lo prometido. Lo que regala lo decide el dashboard al verificar
// el celular (solo cuentas nuevas); aca solo se guarda el codigo y, despues, el aviso del regalo.

const CLAVE = 'capta-invitacion'
const CLAVE_REGALO = 'capta-regalo-pendiente'

const limpiar = (crudo) =>
  String(crudo ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 24)

/** Si la pagina se abrio con ?invitacion=CODIGO, lo guarda. Devuelve el codigo guardado (o ''). */
export function capturarInvitacion() {
  try {
    const dePagina = limpiar(new URLSearchParams(window.location.search).get('invitacion'))
    if (dePagina.length >= 3) {
      window.localStorage?.setItem(CLAVE, dePagina)
      return dePagina
    }
  } catch {
    // sin almacenamiento: la invitacion vale solo mientras este abierta la pagina
  }
  return leerInvitacion()
}

export function leerInvitacion() {
  try {
    return limpiar(window.localStorage?.getItem(CLAVE))
  } catch {
    return ''
  }
}

export function borrarInvitacion() {
  try {
    window.localStorage?.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
}

/** Lo que le toco a la cuenta nueva: se muestra una vez y se olvida. */
export function guardarRegalo(regalo) {
  try {
    window.sessionStorage?.setItem(CLAVE_REGALO, JSON.stringify(regalo))
  } catch {
    // sin almacenamiento: simplemente no se muestra el aviso
  }
}

export function tomarRegalo() {
  try {
    const crudo = window.sessionStorage?.getItem(CLAVE_REGALO)
    if (!crudo) return null
    window.sessionStorage?.removeItem(CLAVE_REGALO)
    const regalo = JSON.parse(crudo)
    return regalo && Array.isArray(regalo.premios) ? regalo : null
  } catch {
    return null
  }
}

/** Despues de verificar el celular: guarda el regalo (si hubo) y olvida el codigo si ya se uso o no sirvio. */
export function registrarResultadoDeInvitacion(datos) {
  if (datos?.invitacion) guardarRegalo(datos.invitacion)
  if (datos?.invitacion || datos?.invitacionMotivo) borrarInvitacion()
}

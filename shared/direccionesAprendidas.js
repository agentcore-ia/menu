// DIRECCIONES APRENDIDAS (igual que el panel: lib/server/direccionesAprendidas.ts).
//
// Hay calles que ni OpenStreetMap ni Google tienen. El local las marca una vez
// en el mapa desde el panel y quedan en la tabla geocodificaciones con calidad
// "manual". El menu las usa antes de preguntarle a cualquier mapa, asi el
// cliente que escribe "Calle 111 849" no se queda sin poder pedir.
//
// La clave tiene que ser IDENTICA a la del panel (claveDireccion).

export const CALIDAD_MANUAL = 'manual'
export const DISTANCIA_DE_CUADRA = 150

const SOLO_TIPO_DE_CALLE = new Set(['calle', 'av', 'avenida', 'pasaje', 'pje', 'ruta', 'diagonal', 'diag', 'boulevard', 'bv', 'camino'])

function limpiar(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function claveDireccion(direccion, ciudad) {
  return [limpiar(direccion), limpiar(ciudad || '')].filter(Boolean).join('|')
}

export function partirCalleYAltura(direccion) {
  const limpia = claveDireccion(direccion)
  const m = limpia.match(/^(.*\S)\s+(\d{1,5})$/)
  if (!m) return { calle: limpia, altura: null }
  return { calle: m[1], altura: Number(m[2]) }
}

export function calleConNombre(calle) {
  return calle.length >= 3 && !SOLO_TIPO_DE_CALLE.has(calle)
}

export function laMasCercana(marcadas, altura) {
  let mejor = null
  let mejorDistancia = Number.POSITIVE_INFINITY
  for (const m of marcadas) {
    const suya = partirCalleYAltura(m.direccion).altura
    if (suya === null) continue
    const distancia = Math.abs(suya - altura)
    if (distancia <= DISTANCIA_DE_CUADRA && distancia < mejorDistancia) {
      mejor = m
      mejorDistancia = distancia
    }
  }
  return mejor
}

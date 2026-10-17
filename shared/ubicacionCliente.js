// La ubicacion que marca el cliente en el mapa del menu.
//
// Reglas sin navegador ni red, compartidas por el menu y el servidor:
//
//   * Un punto vale solo si existe: nada del (0,0) que devuelve un GPS sin
//     señal, ni coordenadas fuera del planeta.
//   * De la respuesta de un geocodificador sale "Calle Altura", que es como la
//     lee el repartidor. La ficha completa (partido, provincia, pais) no le
//     sirve para tocar el timbre.
//
//   node --test shared/ubicacionCliente.test.js

/**
 * Donde arranca el mapa del menu cuando no hay ubicacion del local ni del
 * cliente. NO es la direccion de nadie: si un pedido llega con este punto es
 * porque se confirmo el pin sin moverlo.
 */
export const CENTRO_POR_DEFECTO = { lat: -34.8948, lng: -60.0065 }

/** Si el punto es el de arranque del mapa (con unos 30 m de margen). */
export function esElCentroPorDefecto(punto) {
  const p = puntoValido(punto)
  if (!p) return false
  return Math.abs(p.lat - CENTRO_POR_DEFECTO.lat) < 0.0003 && Math.abs(p.lng - CENTRO_POR_DEFECTO.lng) < 0.0003
}

/** El punto, redondeado a 6 decimales (unos 10 cm), o null si no sirve. */
export function puntoValido(valor) {
  if (!valor || typeof valor !== 'object') return null
  const lat = Number(valor.lat)
  const lng = Number(valor.lng ?? valor.lon)
  if (valor.lat === null || valor.lat === undefined || valor.lat === '') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  if (lat === 0 && lng === 0) return null
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 }
}

/** "Juana Manso 222" de un resultado de Google Geocoding. */
export function direccionDeGoogle(resultado) {
  const componentes = Array.isArray(resultado?.address_components) ? resultado.address_components : []
  const buscar = (tipo) =>
    componentes.find((c) => Array.isArray(c?.types) && c.types.includes(tipo))?.long_name || ''
  const direccion = [buscar('route'), buscar('street_number')].filter(Boolean).join(' ').trim()
  return { direccion, etiqueta: String(resultado?.formatted_address || direccion || '').trim() }
}

/** "Juana Manso 222" de un resultado de Nominatim (OpenStreetMap). */
export function direccionDeNominatim(resultado) {
  const a = resultado?.address || {}
  const calle = a.road || a.pedestrian || a.residential || a.footway || ''
  const direccion = [calle, a.house_number || ''].filter(Boolean).join(' ').trim()
  return { direccion, etiqueta: String(resultado?.display_name || direccion || '').trim() }
}

/**
 * Lo que viaja en el pedido. `fuente` dice de donde salio el punto: "gps" si
 * se confirmo tal cual lo dio el telefono, "mapa" si el cliente movio el pin.
 */
export function ubicacionParaPedido(valor) {
  const punto = puntoValido(valor)
  if (!punto) return null
  const precision = Number(valor.precision)
  return {
    ...punto,
    precision: valor.precision !== null && valor.precision !== undefined && Number.isFinite(precision) && precision >= 0
      ? Math.round(precision)
      : null,
    fuente: valor.fuente === 'gps' ? 'gps' : 'mapa',
  }
}

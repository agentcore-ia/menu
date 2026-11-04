// DONDE QUEDA EL LOCAL, si lo que tiene guardado es un punto de verdad.
// (Misma regla que el panel: Dashboard-agentcore lib/ubicacionLocal.ts.)
//
// Un local sin la ubicacion cargada quedaba con latitud 0 y longitud 0 (el panel
// guardaba Number(null), que da 0): el medio del Atlantico. El mapa del checkout
// arrancaba ahi y los buscadores que solo miran alrededor del local (Photon,
// Mapbox) buscaban en el oceano.
//
//   node --test shared/ubicacionLocal.test.mjs

/** Argentina, con margen. Un punto afuera es un error de carga. */
export function enArgentina(lat, lng) {
  return lat <= -21 && lat >= -56 && lng <= -53 && lng >= -74
}

/** Un numero de verdad: null, "" o nada NO son 0. */
function numero(valor) {
  if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '')) return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

/** El punto del local, o null. Si la latitud y la longitud estan dadas vuelta, se acomodan. */
export function puntoDelLocal(ubicacion) {
  const lat = numero(ubicacion?.lat)
  const lng = numero(ubicacion?.lng ?? ubicacion?.lon)
  if (lat === null || lng === null) return null
  if (enArgentina(lat, lng)) return { lat, lng }
  if (enArgentina(lng, lat)) return { lat: lng, lng: lat }
  return null
}

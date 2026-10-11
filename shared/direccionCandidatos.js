// Ordenar las direcciones que devuelve el mapa antes de mostrarlas al cliente.
//
// Caso real: "jose leon suarez 927" mostraba dos opciones, "Acceso Eva Duarte de
// Peron" y "Avenida Jose Leon Suarez", y le pedia al cliente que eligiera. La
// primera ni se parece a lo que escribio: el mapa la trae porque tiene una
// puerta con ese numero. Y como OpenStreetMap no tiene todas las alturas, a
// veces la unica opcion era la calle entera, con un punto en el medio.
//
//   node --test shared/direccionCandidatos.test.mjs

const GENERICAS = new Set([
  'av', 'avda', 'avenida', 'calle', 'pasaje', 'pje', 'pj', 'bv', 'blvd', 'boulevard',
  'diagonal', 'diag', 'ruta', 'camino', 'acceso', 'autopista', 'al', 'de', 'del', 'la', 'las', 'los', 'el', 'y',
])

function plano(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** La ultima altura de la direccion: "Av Jose Leon Suarez 900" -> 900. */
export function alturaDe(direccion) {
  const m = String(direccion ?? '').match(/(?:^|\s)(\d{1,5})(?=\s|,|$)(?!.*(?:^|\s)\d{1,5}(?=\s|,|$))/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Alturas vecinas, de las mas cercanas a las mas lejanas, en oleadas de a cuatro. */
export function alturasVecinas(altura) {
  return [[2, 10], [50, 100]].map((pasos) =>
    pasos.flatMap((p) => [altura - p, altura + p]).filter((n) => n > 0),
  )
}

/** La direccion escrita con otra altura (reemplaza la ultima ocurrencia). */
export function direccionConAltura(direccion, de, a) {
  const texto = String(direccion ?? '')
  const idx = texto.lastIndexOf(String(de))
  if (idx < 0) return texto
  return texto.slice(0, idx) + String(a) + texto.slice(idx + String(de).length)
}

/** Reemplaza la primera aparicion de la altura en la etiqueta del mapa. */
export function conLaAltura(etiqueta, de, a) {
  return String(etiqueta ?? '').replace(new RegExp(`\\b${de}\\b`), String(a))
}

/** Las palabras que nombran la calle: sin numeros ni "av", "calle", "de"... */
export function palabrasDeCalle(direccion) {
  return plano(direccion)
    .split(' ')
    .filter((p) => p && !/^\d+$/.test(p) && !GENERICAS.has(p))
}

/**
 * Deja solo las direcciones que nombran la calle escrita. Si ninguna la
 * nombra (el cliente se equivoco al tipear) se devuelven todas: peor que
 * mostrar una lista es no mostrar nada.
 */
export function soloLaCalleEscrita(candidatos, direccion) {
  const lista = Array.isArray(candidatos) ? candidatos : []
  const palabras = palabrasDeCalle(direccion)
  if (!palabras.length) return lista
  const coinciden = lista.filter((c) => {
    const etiqueta = plano(c?.label)
    return palabras.every((p) => etiqueta.includes(p))
  })
  return coinciden.length ? coinciden : lista
}

/** Una puerta (casa o edificio), no la calle entera. */
export function esPuerta(calidad) {
  return ['house', 'building', 'place', 'yes'].includes(String(calidad ?? '').toLowerCase())
}

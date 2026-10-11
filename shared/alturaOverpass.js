// Ubicar una altura que OpenStreetMap no tiene, usando las que si tiene.
// Espejo de lib/server/alturaOverpass.ts del dashboard (ahi esta el original).
//
//   node --test shared/alturaOverpass.test.mjs

/** Cuantos numeros mas alla de la ultima puerta se sigue la calle. */
const MAX_EXTRAPOLACION = 400

export function ubicarAltura(altura, puertas) {
  const validas = (puertas || []).filter(
    (p) => Number.isFinite(p.n) && p.n > 0 && Number.isFinite(p.lat) && Number.isFinite(p.lng),
  )
  if (!validas.length || !Number.isFinite(altura) || altura <= 0) return null

  const mismoLado = validas.filter((p) => p.n % 2 === altura % 2)
  const base = mismoLado.length >= 2 ? mismoLado : validas

  const porNumero = new Map()
  for (const p of base) porNumero.set(p.n, [...(porNumero.get(p.n) || []), p])
  const puntos = [...porNumero.entries()]
    .map(([n, lista]) => ({
      n,
      lat: lista.reduce((a, p) => a + p.lat, 0) / lista.length,
      lng: lista.reduce((a, p) => a + p.lng, 0) / lista.length,
    }))
    .sort((a, b) => a.n - b.n)

  const exacta = puntos.find((p) => p.n === altura)
  if (exacta) return { lat: exacta.lat, lng: exacta.lng, tipo: 'exacta' }

  const debajo = [...puntos].reverse().find((p) => p.n < altura)
  const encima = puntos.find((p) => p.n > altura)

  if (debajo && encima) {
    const t = (altura - debajo.n) / (encima.n - debajo.n)
    return {
      lat: debajo.lat + (encima.lat - debajo.lat) * t,
      lng: debajo.lng + (encima.lng - debajo.lng) * t,
      tipo: 'interpolada',
    }
  }

  const desdeFin = debajo ? [...puntos].reverse() : puntos
  const extremo = desdeFin[0]
  const referencia = desdeFin.find((p) => Math.abs(p.n - extremo.n) >= 100) || desdeFin[1]
  if (!extremo || !referencia || referencia.n === extremo.n) return null
  if (Math.abs(altura - extremo.n) > MAX_EXTRAPOLACION) return null
  const k = (altura - extremo.n) / (extremo.n - referencia.n)
  return {
    lat: extremo.lat + (extremo.lat - referencia.lat) * k,
    lng: extremo.lng + (extremo.lng - referencia.lng) * k,
    tipo: 'extrapolada',
  }
}

/** El nombre de la calle tal como lo escribe OpenStreetMap, sacado de una etiqueta. */
export function nombreDeCalleDeEtiqueta(etiqueta) {
  const partes = String(etiqueta || '').split(',').map((p) => p.trim()).filter(Boolean)
  return partes.find((p) => !/^\d+[a-z]?$/i.test(p)) || null
}

// Overpass publico: a veces tarda o rechaza. Hay dos servidores y un cache de
// un dia por calle (las puertas de una calle casi no cambian).
const SERVIDORES = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const CACHE = new Map()
const CACHE_MS = 24 * 3600 * 1000

/** Las puertas con numero de esa calle, alrededor de un punto. Nunca tira. */
export async function puertasDeLaCalle(calle, centro, medioLadoGrados = 0.06) {
  const nombre = String(calle || '').replace(/[\\"]/g, '').trim()
  if (!nombre) return []
  const clave = `${nombre.toLowerCase()}|${centro.lat.toFixed(2)}|${centro.lng.toFixed(2)}`
  const guardada = CACHE.get(clave)
  if (guardada && Date.now() - guardada.at < CACHE_MS) return guardada.puertas

  const caja = `${centro.lat - medioLadoGrados},${centro.lng - medioLadoGrados},${centro.lat + medioLadoGrados},${centro.lng + medioLadoGrados}`
  const consulta = `[out:json][timeout:15];node["addr:street"="${nombre}"]["addr:housenumber"](${caja});out;`
  for (const servidor of SERVIDORES) {
    try {
      const res = await fetch(`${servidor}?data=${encodeURIComponent(consulta)}`, {
        headers: { 'User-Agent': 'Capta/1.0 (menu; soporte@capta.ar)', Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const json = await res.json().catch(() => null)
      if (!json) continue
      const puertas = []
      for (const e of json.elements || []) {
        const digitos = String(e?.tags?.['addr:housenumber'] || '').replace(/\D/g, '')
        const n = Number(digitos)
        const lat = Number(e.lat)
        const lng = Number(e.lon)
        if (digitos && n > 0 && Number.isFinite(lat) && Number.isFinite(lng)) puertas.push({ n, lat, lng })
      }
      // Overpass sobrecargado contesta 200 con la lista vacia y un "remark":
      // eso no es "la calle no tiene puertas". No se guarda ni se acepta.
      if (!puertas.length) continue
      CACHE.set(clave, { at: Date.now(), puertas })
      return puertas
    } catch {
      /* siguiente servidor */
    }
  }
  return []
}

// QUE TAN SEGURO ES EL PUNTO DE UNA DIRECCION, Y QUE ZONA COBRAR SI NO LO ES.
// (La misma regla que el panel: Dashboard-agentcore lib/server/precisionDireccion.ts.)
//
// Casos reales que hacian perder plata:
// - "Padre Zacarias 1400": el mapa no tiene esa puerta y devuelve la 400 de la
//   misma calle (Photon y Mapbox contestan con la puerta mas parecida que
//   tengan). Se tomaba como si fuera la casa: Zona 1 en vez de Zona 3.
// - Sin la puerta, el punto sale de una aproximacion (la altura vecina, la
//   calle seguida desde la ultima puerta conocida o el medio de la calle) y cae
//   a unas cuadras, del lado barato del limite entre dos zonas.
//
// Dos reglas:
// 1. Una puerta del mapa vale solo si su numero es el que escribio el cliente.
//    Si es otro numero de la misma cuadra queda como aproximada; si es de otra
//    cuadra se descarta (es otra casa).
// 2. Cada punto lleva un radio de duda en metros (0 = la puerta exacta). Si en
//    ese radio entran dos zonas, se cobra la mas cara y se avisa: el cliente
//    que marca su puerta en el mapa paga lo justo. Antes se cobraba la mas
//    barata sin avisar.
//
//   node --test shared/precisionDireccion.test.mjs

/** Un numero de otra cuadra (mas de esto de diferencia) es otra casa. */
export const DIFERENCIA_MAXIMA = 100
/** El medio de la calle, sin ninguna puerta: puede estar a varias cuadras. */
export const RADIO_CALLE_M = 500
/** Puerta que el proveedor ubico interpolando su rango de numeros. */
export const RADIO_INTERPOLADA_PROVEEDOR_M = 40

const CALIDADES_DE_PUERTA = ['house', 'building', 'place', 'yes']

/** Cien numeros son una cuadra (unos 110-130 m en las ciudades de la zona). */
export function radioPorDiferencia(diferencia) {
  const d = Math.abs(Number(diferencia) || 0)
  return d === 0 ? 0 : Math.round(25 + d * 1.3)
}

/** "955" -> 955-955, "953-957" -> 953-957, "955 A" / "955bis" -> 955-955. */
export function numeroDeLaPuerta(valor) {
  const texto = String(valor ?? '').trim()
  const rango = texto.match(/^(\d{1,5})\s*[-/]\s*(\d{1,5})/)
  if (rango) {
    const a = Number(rango[1])
    const b = Number(rango[2])
    if (a > 0 && b > 0) return { desde: Math.min(a, b), hasta: Math.max(a, b) }
  }
  const solo = texto.match(/^(\d{1,5})/)
  if (!solo) return null
  const n = Number(solo[1])
  return n > 0 ? { desde: n, hasta: n } : null
}

/**
 * La altura que escribio el cliente. Null si no puso altura: en "Calle 111" o
 * "Ruta 5" el numero es el nombre de la calle.
 */
export function alturaEscrita(direccion) {
  const texto = String(direccion || '').trim()
  if (/^(calle|ruta|diagonal|diag|pasaje|pje|camino)\s+\d{1,4}\s*$/i.test(texto)) return null
  const m = texto.match(/(?:^|\s)(\d{1,5})(?=\s|,|$)(?!.*(?:^|\s)\d{1,5}(?=\s|,|$))/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Los numeros que son parte del NOMBRE de la calle ("Calle 88 275" -> [88]). */
function numerosDelNombre(direccion, altura) {
  return (String(direccion || '').match(/\d+/g) || []).map(Number).filter((n) => n !== altura)
}

/**
 * El numero de puerta de una etiqueta del mapa, cuando el proveedor no lo da
 * aparte: "955, Ayacucho, Chivilcoy" o "Ayacucho 955, Chivilcoy".
 */
export function numeroEnEtiqueta(etiqueta, direccion) {
  const primera = String(etiqueta || '').split(',')[0]?.trim() || ''
  if (/^\d{1,5}[a-z]?$/i.test(primera)) return Number(primera.replace(/\D/g, ''))
  const delNombre = numerosDelNombre(direccion, alturaEscrita(direccion))
  const numeros = (primera.match(/\d{1,5}/g) || []).map(Number).filter((n) => !delNombre.includes(n))
  return numeros.length ? numeros[numeros.length - 1] : null
}

/**
 * Que tan seguro es un resultado del mapa ({ label, calidad, numero, interpolada })
 * para la direccion escrita. `descartar`: es una puerta de OTRA cuadra de la
 * misma calle (otra casa).
 */
export function calificarResultado(c, direccion) {
  const esPuerta = CALIDADES_DE_PUERTA.includes(String(c?.calidad || '').toLowerCase())
  const altura = alturaEscrita(direccion)
  if (!esPuerta) return { precision: 'calle', radioM: RADIO_CALLE_M, descartar: false, diferencia: null }
  // Sin altura escrita no hay con que comparar: la puerta es lo que pidio.
  if (altura === null) return { precision: 'exacta', radioM: 0, descartar: false, diferencia: 0 }

  let rango = numeroDeLaPuerta(c?.numero)
  if (!rango) {
    const n = numeroEnEtiqueta(c?.label, direccion)
    rango = n ? { desde: n, hasta: n } : null
  }
  // Una "puerta" sin numero (un edificio, un comercio): no dice en que altura esta.
  if (!rango) return { precision: 'calle', radioM: RADIO_CALLE_M, descartar: false, diferencia: null }

  const diferencia = altura < rango.desde ? rango.desde - altura : altura > rango.hasta ? altura - rango.hasta : 0
  if (diferencia > DIFERENCIA_MAXIMA) return { precision: 'cercana', radioM: radioPorDiferencia(diferencia), descartar: true, diferencia }
  if (diferencia > 0) return { precision: 'cercana', radioM: radioPorDiferencia(diferencia), descartar: false, diferencia }
  if (c?.interpolada) return { precision: 'interpolada', radioM: RADIO_INTERPOLADA_PROVEEDOR_M, descartar: false, diferencia: 0 }
  return { precision: 'exacta', radioM: 0, descartar: false, diferencia: 0 }
}

/** Radio de duda de un punto sacado de las puertas conocidas de la calle (Overpass). */
export function radioDeAlturaUbicada(tipo, brecha) {
  if (tipo === 'exacta') return 0
  const b = Math.abs(Number(brecha) || 0)
  // Interpolar entre dos puertas lejanas recorta las curvas de la calle.
  if (tipo === 'interpolada') return Math.round(30 + Math.min(b, 1500) * 0.12)
  return Math.round(40 + b * 1.3)
}

/**
 * Revisa los resultados de un buscador contra la direccion escrita: saca las
 * puertas de otra cuadra, marca las de la misma cuadra como aproximadas
 * (engine "...-altura-cercana") y le pone a cada uno su radio de duda.
 */
export function verificarPuertas(lista, direccion) {
  const salida = []
  for (const c of lista || []) {
    const cal = calificarResultado(c, direccion)
    if (cal.descartar) continue
    const eraPuerta = CALIDADES_DE_PUERTA.includes(String(c?.calidad || '').toLowerCase())
    const engine = String(c?.engine || '')
    salida.push({
      ...c,
      // Una "puerta" sin numero no es la casa: queda como la calle.
      calidad: eraPuerta && cal.precision === 'calle' ? 'sin_numero' : c.calidad,
      engine: cal.precision === 'cercana' && !engine.includes('altura') ? `${engine}-altura-cercana` : c.engine,
      radioM: cal.radioM,
      precision: cal.precision,
    })
  }
  return salida
}

// ---------------------------------------------------------------------------
// Un punto de un proveedor pago, contra las puertas que se conocen de la calle
// ---------------------------------------------------------------------------

/** Metros entre dos puntos (suficiente para distancias de una ciudad). */
export function metrosEntre(a, b) {
  const dLat = (b.lat - a.lat) * 111_320
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180)
  return Math.hypot(dLat, dLng)
}

/** Cien numeros son al menos esto: aunque la calle doble, no se juntan. */
const METROS_MINIMOS_POR_NUMERO = 0.35
/** Desde esta diferencia de numeracion se exige que esten lejos. */
const DIFERENCIA_PARA_EXIGIR_DISTANCIA = 300

/**
 * Si un punto que da un proveedor para "Calle N" cuadra con las puertas que
 * OpenStreetMap conoce de esa calle. "Lavalle 1338": el proveedor contestaba
 * con el numero justo pero el punto de la 400 (rangos de numeros mal cargados):
 * se cobraba la zona de la 400. `ubicar` es ubicarAltura (shared/alturaOverpass.js).
 */
export function coherenciaConLaCalle(punto, altura, puertas, ubicar) {
  const validas = (puertas || []).filter((p) => p.n > 0 && Number.isFinite(p.lat) && Number.isFinite(p.lng))
  if (!validas.length) return { coherente: true, esperado: null, motivo: null }

  const ubicado = ubicar(altura, validas)
  const esperado = ubicado ? { lat: ubicado.lat, lng: ubicado.lng, radioM: radioDeAlturaUbicada(ubicado.tipo, ubicado.brecha) } : null

  // Una puerta MUY lejos en numeracion que queda pegada al punto: imposible.
  for (const p of validas) {
    const diferencia = Math.abs(p.n - altura)
    if (diferencia < DIFERENCIA_PARA_EXIGIR_DISTANCIA) continue
    const metros = metrosEntre(punto, p)
    if (metros < diferencia * METROS_MINIMOS_POR_NUMERO) {
      return { coherente: false, esperado, motivo: `queda a ${Math.round(metros)} m de la ${p.n}` }
    }
  }
  // Lejos de donde la ubican las puertas de la calle.
  if (esperado) {
    const tolerancia = 150 + esperado.radioM * 1.5
    const metros = metrosEntre(punto, esperado)
    if (metros > tolerancia) {
      return { coherente: false, esperado, motivo: `queda a ${Math.round(metros)} m de donde la ubican las puertas de la calle` }
    }
  }
  return { coherente: true, esperado, motivo: null }
}

// ---------------------------------------------------------------------------
// La zona con duda
// ---------------------------------------------------------------------------

/** Puntos alrededor del centro: el centro, 16 a la distancia del radio y 8 a la mitad. */
export function puntosAlrededor(centro, radioM) {
  const puntos = [{ lat: centro.lat, lng: centro.lng }]
  if (!(radioM > 0)) return puntos
  const metrosPorGradoLat = 111_320
  const metrosPorGradoLng = 111_320 * Math.cos((centro.lat * Math.PI) / 180)
  const anillo = (r, cantidad) => {
    for (let i = 0; i < cantidad; i++) {
      const a = (2 * Math.PI * i) / cantidad
      puntos.push({
        lat: centro.lat + (r * Math.sin(a)) / metrosPorGradoLat,
        lng: centro.lng + (r * Math.cos(a)) / metrosPorGradoLng,
      })
    }
  }
  anillo(radioM, 16)
  anillo(radioM / 2, 8)
  return puntos
}

/**
 * La zona a cobrar para un punto con duda. Si el punto cae fuera del area, es
 * fuera (como siempre). Si cae adentro y en el radio entran otras zonas, se
 * cobra la mas cara de las que entran.
 */
export function zonaConDuda(centro, radioM, zonaDelPunto) {
  const delCentro = zonaDelPunto(centro)
  if (!delCentro || !(radioM > 0)) return { zona: delCentro, posibles: delCentro ? [delCentro] : [], dudosa: false }
  const porId = new Map([[delCentro.id, delCentro]])
  for (const p of puntosAlrededor(centro, radioM).slice(1)) {
    const z = zonaDelPunto(p)
    if (z && !porId.has(z.id)) porId.set(z.id, z)
  }
  const posibles = [...porId.values()].sort((a, b) => a.fee - b.fee)
  const masCara = posibles[posibles.length - 1]
  return { zona: masCara.fee > delCentro.fee ? masCara : delCentro, posibles, dudosa: posibles.length > 1 }
}

/** "Zona dudosa (Zona 1 / Zona 2): se cobro Zona 2" para las notas del pedido. */
export function avisoDeZonaDudosa(posibles, cobrada) {
  const nombres = posibles.map((z) => z.name).join(' / ')
  return `Zona dudosa (${nombres}): no se encontro la altura exacta y se cobro ${cobrada?.name || 'la mas cara'}. Verificá la dirección.`
}

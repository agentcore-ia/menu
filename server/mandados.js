// Los mandados de Capta Delivery en la app de pedidos (/pedi): "comprame
// algo", "llevá este paquete", como los Favores de Rappi.
//
// Los mandados son de Capta, no de un local: los arma, cobra y despacha el
// DASHBOARD (lib/server/mandadosCapta.ts). Este servidor hace solo dos cosas:
//
//   1. Buscar la direccion del cliente con el mismo buscador que usan todos los
//      menus (server/deliveryZones.js), que ofrece varias opciones para elegir.
//   2. Pasarle todo al dashboard con la clave de servicio, que no sale de aca
//      (mismo esquema que estadoDelPago.js y pagarConTarjeta.js).
//
//   GET  /api/delivery/mandados?accion=ciudades
//   GET  /api/delivery/mandados?accion=cotizar&address=&neighborhood=&city=[&lat&lng][&olat&olng]
//   POST /api/delivery/mandados  { ciudad, cliente, mandado, punto, notas }
import { getServerConfig } from './config.js'
import { geocodeDeliveryCandidates } from './deliveryZones.js'

/** Lejos de esto del centro de la ciudad no es una direccion de la ciudad. */
const KM_MAXIMO_DEL_CENTRO = 25

function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

function punto(lat, lng, label) {
  const la = numero(lat)
  const ln = numero(lng)
  if (la === null || ln === null || Math.abs(la) > 90 || Math.abs(ln) > 180 || (la === 0 && ln === 0)) return null
  return { lat: la, lng: ln, ...(label ? { label: String(label).slice(0, 200) } : {}) }
}

async function alDashboard(ruta, { method = 'GET', body } = {}) {
  const config = getServerConfig()
  const baseUrl = String(config.dashboardUrl || '').replace(/\/+$/, '')
  const serviceKey = config.internalServiceKey || config.supabaseWriteApiKey
  if (!baseUrl || (method !== 'GET' && !serviceKey)) {
    const error = new Error('Los mandados no están disponibles en este momento.')
    error.statusCode = 503
    throw error
  }

  const respuesta = await fetch(`${baseUrl}${ruta}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(method !== 'GET' ? { 'x-capta-service-key': serviceKey } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const texto = await respuesta.text()
  let datos
  try {
    datos = texto ? JSON.parse(texto) : {}
  } catch {
    datos = {}
  }
  if (!respuesta.ok) {
    const error = new Error(datos?.message || datos?.error || 'No pudimos procesar el mandado.')
    error.statusCode = respuesta.status >= 400 && respuesta.status < 500 ? respuesta.status : 502
    throw error
  }
  return datos
}

async function ciudades(_req, res) {
  // Cambia poco: un minuto de cache alivia al dashboard sin que prender una
  // ciudad tarde en verse.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=120')
  const datos = await alDashboard('/api/delivery/capta/mandados?accion=ciudades')
  res.status(200).json({ ciudades: Array.isArray(datos?.ciudades) ? datos.ciudades : [] })
}

/**
 * Cuanto sale el envio del mandado. Con el punto ya elegido, cotiza ese; si no,
 * busca la direccion y devuelve las opciones con su precio. Misma forma de
 * respuesta que /delivery-zone de los menus.
 */
async function cotizar(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  const q = req.query ?? {}
  const ciudad = String(q.city || '').trim()
  const elegido = punto(q.lat, q.lng, q.label)

  let opciones
  if (elegido) {
    opciones = [{ id: 'elegido', label: elegido.label || String(q.address || ''), coordinates: elegido }]
  } else {
    const direccion = String(q.address || '').trim()
    if (direccion.length < 4) {
      res.status(200).json({ allowed: false, fee: 0, message: 'Escribí calle y altura para calcular el envío.' })
      return
    }
    const centro = punto(q.olat, q.olng)
    const encontrados = await geocodeDeliveryCandidates({
      address: direccion,
      neighborhood: String(q.neighborhood || '').trim(),
      city: ciudad,
      originCoordinates: centro,
      limit: 5,
    })
    opciones = encontrados
      .filter((c) => !centro || c.distanceKm === null || c.distanceKm <= KM_MAXIMO_DEL_CENTRO)
      .map((c) => ({ id: c.id, label: c.label, coordinates: { lat: c.lat, lng: c.lng, label: c.label } }))
  }

  if (!opciones.length) {
    res.status(200).json({
      allowed: false,
      fee: 0,
      message: 'No encontramos esa dirección. Probá con calle y altura, sin la ciudad.',
    })
    return
  }

  const { cotizaciones = [] } = await alDashboard('/api/delivery/capta/mandados', {
    method: 'POST',
    body: { accion: 'cotizar', ciudad, puntos: opciones.map((o) => o.coordinates) },
  })
  const conPrecio = opciones.map((o, i) => {
    const c = cotizaciones[i]
    return { ...o, allowed: Boolean(c), fee: c?.fee ?? 0, zone: c ? { name: c.zona } : null }
  })

  // Una sola opcion (o la que ya eligio): no hay nada que preguntar.
  if (conPrecio.length === 1) {
    const unica = conPrecio[0]
    res.status(200).json(
      unica.allowed
        ? { allowed: true, fee: unica.fee, zone: unica.zone, coordinates: unica.coordinates }
        : { allowed: false, fee: 0, coordinates: unica.coordinates, message: 'Esa dirección está fuera de la zona de envío.' },
    )
    return
  }

  res.status(200).json({ allowed: false, fee: 0, needsConfirmation: true, candidates: conPrecio })
}

async function crear(req, res) {
  const b = req.body ?? {}
  const datos = await alDashboard('/api/delivery/capta/mandados', {
    method: 'POST',
    body: {
      accion: 'crear',
      ciudad: b.ciudad,
      cliente: b.cliente,
      mandado: b.mandado,
      punto: b.punto,
      notas: b.notas,
    },
  })
  // El link para seguir el mandado (lo arma el dashboard con un token al azar).
  const seguimiento = /^https:\/\/[a-z0-9.-]+\/seguimiento\/mandado\/[a-f0-9]{16,64}$/i.test(String(datos?.seguimiento || ''))
    ? datos.seguimiento
    : null
  res.status(201).json({ numero: datos?.numero ?? null, envio: datos?.envio ?? 0, seguimiento })
}

export async function mandados(req, res) {
  try {
    const accion = String(req.query?.accion || '')
    if (req.method === 'GET' && accion === 'ciudades') return await ciudades(req, res)
    if (req.method === 'GET' && accion === 'cotizar') return await cotizar(req, res)
    if (req.method === 'POST') return await crear(req, res)
    res.status(400).json({ message: 'Acción desconocida.' })
  } catch (error) {
    res.status(error?.statusCode ?? 500).json({
      message: error instanceof Error ? error.message : 'No pudimos procesar el mandado.',
    })
  }
}

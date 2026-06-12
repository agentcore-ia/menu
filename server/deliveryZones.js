const DEFAULT_COUNTRY = 'Argentina'
const EARTH_RADIUS_KM = 6371

export function normalizeDeliveryZones(value) {
  if (!Array.isArray(value)) return []

  return value
    .map((zone, index) => {
      const polygon = Array.isArray(zone?.polygon)
        ? zone.polygon
            .map((point) => ({
              lat: Number(point?.lat),
              lng: Number(point?.lng),
            }))
            .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
        : []

      return {
        id: String(zone?.id || `zone-${index + 1}`),
        name: String(zone?.name || `Zona ${index + 1}`).trim(),
        fee: Math.max(0, Number(zone?.fee || 0)),
        active: zone?.active !== false,
        color: String(zone?.color || '#f97316'),
        polygon,
      }
    })
    .filter((zone) => zone.name && zone.polygon.length >= 3)
}

export function getDeliveryZoneSettings(horarios) {
  const settings = horarios && typeof horarios === 'object' ? horarios._settings : null
  const zones = normalizeDeliveryZones(settings?.deliveryZones)

  return {
    enabled: settings?.deliveryZonesEnabled === true && zones.some((zone) => zone.active),
    zones,
  }
}

export function pointInPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false

  const x = Number(point.lng)
  const y = Number(point.lat)
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i].lng)
    const yi = Number(polygon[i].lat)
    const xj = Number(polygon[j].lng)
    const yj = Number(polygon[j].lat)
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

export function findDeliveryZone(point, zones) {
  return normalizeDeliveryZones(zones).find((zone) => zone.active && pointInPolygon(point, zone.polygon)) ?? null
}

export function normalizeBusinessLocation(horarios) {
  const settings = horarios && typeof horarios === 'object' ? horarios._settings : null
  const location = settings?.businessLocation || {}
  const coordinates = normalizeCoordinates(location)

  return {
    province: String(location.province || '').trim(),
    coordinates,
  }
}

function getDistanceKm(a, b) {
  const pointA = normalizeCoordinates(a)
  const pointB = normalizeCoordinates(b)
  if (!pointA || !pointB) return Number.POSITIVE_INFINITY

  const toRadians = (value) => (Number(value) * Math.PI) / 180
  const dLat = toRadians(pointB.lat - pointA.lat)
  const dLng = toRadians(pointB.lng - pointA.lng)
  const lat1 = toRadians(pointA.lat)
  const lat2 = toRadians(pointB.lat)
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

function normalizeCoordinates(value) {
  const lat = Number(value?.lat)
  const lng = Number(value?.lng ?? value?.lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return {
    lat,
    lng,
    label: value?.label || '',
  }
}

function mapGeocodeCandidate(result, fallbackLabel) {
  const coordinates = normalizeCoordinates({
    lat: result?.lat,
    lng: result?.lon,
    label: result?.display_name || fallbackLabel,
  })

  if (!coordinates) return null

  return {
    id: String(result?.place_id || `${coordinates.lat},${coordinates.lng}`),
    lat: coordinates.lat,
    lng: coordinates.lng,
    label: coordinates.label,
  }
}

export async function geocodeDeliveryCandidates({ address, neighborhood, city, province, originCoordinates, limit = 5 }) {
  const parts = [address, neighborhood, city, province, DEFAULT_COUNTRY]
    .map((part) => String(part || '').trim())
    .filter(Boolean)

  if (!parts.length || String(address || '').trim().length < 4) {
    return []
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', String(Math.min(Math.max(Number(limit) || 5, 1), 8)))
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'ar')
  url.searchParams.set('q', parts.join(', '))
  const origin = normalizeCoordinates(originCoordinates)

  if (origin) {
    const delta = 0.35
    url.searchParams.set(
      'viewbox',
      `${origin.lng - delta},${origin.lat + delta},${origin.lng + delta},${origin.lat - delta}`,
    )
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'capta-menu-delivery-zones/1.0',
      Accept: 'application/json',
    },
  })

  if (!response.ok) return []

  const results = await response.json()

  if (!Array.isArray(results)) return []

  return results
    .map((result) => mapGeocodeCandidate(result, parts.join(', ')))
    .filter(Boolean)
    .map((candidate) => ({
      ...candidate,
      distanceKm: origin ? getDistanceKm(candidate, origin) : null,
    }))
    .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
}

export async function geocodeDeliveryAddress(input) {
  const [candidate] = await geocodeDeliveryCandidates({ ...input, limit: 1 })
  return candidate ?? null
}

function buildQuoteForCoordinates({ coordinates, settings }) {
  const zone = findDeliveryZone(coordinates, settings.zones)

  if (!zone) {
    return {
      enabled: true,
      allowed: false,
      fee: 0,
      zone: null,
      coordinates,
      message: 'La direccion esta fuera del area de entrega del local.',
    }
  }

  return {
    enabled: true,
    allowed: true,
    fee: zone.fee,
    zone: {
      id: zone.id,
      name: zone.name,
      fee: zone.fee,
    },
    coordinates,
    message: `Zona de entrega: ${zone.name}.`,
  }
}

export async function resolveDeliveryQuote({
  horarios,
  fallbackFee,
  address,
  neighborhood,
  city,
  province,
  originCoordinates,
  coordinates,
  confirmed = false,
}) {
  const settings = getDeliveryZoneSettings(horarios)
  const businessLocation = normalizeBusinessLocation(horarios)
  const effectiveProvince = province || businessLocation.province
  const effectiveOrigin = originCoordinates || businessLocation.coordinates

  if (!settings.enabled) {
    return {
      enabled: false,
      allowed: true,
      fee: Math.max(0, Number(fallbackFee || 0)),
      zone: null,
      coordinates: null,
      message: '',
    }
  }

  const selectedCoordinates = normalizeCoordinates(coordinates)

  if (selectedCoordinates) {
    return buildQuoteForCoordinates({ coordinates: selectedCoordinates, settings })
  }

  const candidates = await geocodeDeliveryCandidates({
    address,
    neighborhood,
    city,
    province: effectiveProvince,
    originCoordinates: effectiveOrigin,
    limit: 5,
  })

  if (!candidates.length) {
    return {
      enabled: true,
      allowed: false,
      fee: 0,
      zone: null,
      coordinates: null,
      candidates: [],
      needsConfirmation: false,
      message: 'No pudimos ubicar esa direccion. Proba escribir calle y altura, sin ciudad.',
    }
  }

  const candidatesWithZones = candidates.map((candidate) => {
    const zone = findDeliveryZone(candidate, settings.zones)
    return {
      id: candidate.id,
      label: candidate.label,
      distanceKm: candidate.distanceKm,
      coordinates: {
        lat: candidate.lat,
        lng: candidate.lng,
        label: candidate.label,
      },
      allowed: Boolean(zone),
      fee: zone?.fee ?? 0,
      zone: zone
        ? {
            id: zone.id,
            name: zone.name,
            fee: zone.fee,
          }
        : null,
    }
  })

  if (!confirmed) {
    return {
      enabled: true,
      allowed: false,
      fee: 0,
      zone: null,
      coordinates: null,
      candidates: candidatesWithZones,
      needsConfirmation: true,
      message: 'Confirma cual de estas direcciones es la correcta.',
    }
  }

  return buildQuoteForCoordinates({ coordinates: candidates[0], settings })
}

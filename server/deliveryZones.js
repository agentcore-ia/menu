const DEFAULT_COUNTRY = 'Argentina'

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

export async function geocodeDeliveryAddress({ address, neighborhood, city }) {
  const parts = [address, neighborhood, city, DEFAULT_COUNTRY]
    .map((part) => String(part || '').trim())
    .filter(Boolean)

  if (!parts.length || String(address || '').trim().length < 4) {
    return null
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'ar')
  url.searchParams.set('q', parts.join(', '))

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'capta-menu-delivery-zones/1.0',
      Accept: 'application/json',
    },
  })

  if (!response.ok) return null

  const [result] = await response.json()
  const lat = Number(result?.lat)
  const lng = Number(result?.lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return {
    lat,
    lng,
    label: result?.display_name || parts.join(', '),
  }
}

export async function resolveDeliveryQuote({ horarios, fallbackFee, address, neighborhood, city }) {
  const settings = getDeliveryZoneSettings(horarios)

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

  const coordinates = await geocodeDeliveryAddress({ address, neighborhood, city })

  if (!coordinates) {
    return {
      enabled: true,
      allowed: false,
      fee: 0,
      zone: null,
      coordinates: null,
      message: 'No pudimos ubicar esa direccion. Revisa calle, altura y ciudad.',
    }
  }

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

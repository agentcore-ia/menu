// La vitrina de Capta Delivery: la pantalla donde el cliente ve TODOS los
// negocios que reparten con Capta y entra al menu del que quiere.
//
// Aca vive lo que hay que decidir sobre cada local (si se muestra, en que
// categoria cae, que dice la tarjeta). Es un archivo sin pantalla ni base a
// proposito: el servidor arma la lista con esto y la pantalla solo la dibuja.
//
// La regla de "este local no se tiene que ver" vive del lado del servidor, no
// en la pantalla: si un local no esta en la lista que devuelve la API, no hay
// forma de que aparezca escondido en el HTML.

/**
 * Las categorias de la vitrina, en el orden en que salen los botones.
 *
 * `label` va en plural porque es un filtro ("Heladerias"), y `singular` es lo
 * que dice la tarjeta de un local ("Heladeria").
 */
const CATEGORIAS = [
  { id: 'comida', label: 'Casas de comida', singular: 'Casa de comida' },
  { id: 'hamburgueseria', label: 'Hamburgueserías', singular: 'Hamburguesería' },
  { id: 'pizzeria', label: 'Pizzerías', singular: 'Pizzería' },
  { id: 'rotiseria', label: 'Rotiserías', singular: 'Rotisería' },
  { id: 'heladeria', label: 'Heladerías', singular: 'Heladería' },
  { id: 'panaderia', label: 'Panaderías', singular: 'Panadería' },
  { id: 'cafeteria', label: 'Cafeterías', singular: 'Cafetería' },
  { id: 'kiosco', label: 'Kioscos', singular: 'Kiosco' },
  { id: 'dietetica', label: 'Dietéticas', singular: 'Dietética' },
  { id: 'farmacia', label: 'Farmacias', singular: 'Farmacia' },
]

const IDS = new Set(CATEGORIAS.map((c) => c.id))

// Lo que cargo el local al darse de alta (restaurants.business_type) o lo que
// eligio despues en ajustes (_settings.rubro). "restaurant" y "otro" no dicen
// nada util: son el descarte y se resuelven mirando la plantilla del menu.
const POR_RUBRO = {
  heladeria: 'heladeria',
  panaderia: 'panaderia',
  cafeteria: 'cafeteria',
  kiosco: 'kiosco',
  dietetica: 'dietetica',
  farmacia: 'farmacia',
  rotiseria: 'rotiseria',
  pizzeria: 'pizzeria',
  hamburgueseria: 'hamburgueseria',
  comercio: 'kiosco',
}

// La plantilla del menu es la ultima pista: un local cargado como "restaurant"
// que eligio la plantilla de pizzeria vende pizzas.
const POR_PLANTILLA = {
  pizzeria: 'pizzeria',
  burger: 'hamburgueseria',
  gelato: 'heladeria',
  panaderia: 'panaderia',
}

function texto(valor) {
  return String(valor ?? '').trim().toLowerCase()
}

/** Los ajustes del local (restaurants.horarios._settings), o un objeto vacio. */
export function ajustesDelLocal(horarios) {
  return horarios && typeof horarios === 'object' && !Array.isArray(horarios)
    ? horarios._settings ?? {}
    : {}
}

/**
 * En que categoria de la vitrina cae el local.
 *
 * Gana lo que se eligio a mano en el panel (_settings.captaCategoria); despues
 * el rubro; al final la plantilla del menu. Si nada alcanza, es una casa de
 * comida, que es donde entra cualquier local gastronomico.
 */
export function categoriaDeVitrina({ captaCategoria, rubro, businessType, plantilla } = {}) {
  const aMano = texto(captaCategoria)
  if (IDS.has(aMano)) return aMano

  const delPanel = POR_RUBRO[texto(rubro)]
  if (delPanel) return delPanel

  const delAlta = POR_RUBRO[texto(businessType)]
  if (delAlta) return delAlta

  const deLaPlantilla = POR_PLANTILLA[texto(plantilla)]
  if (deLaPlantilla) return deLaPlantilla

  return 'comida'
}

/** Como se llama esa categoria en la pantalla. */
export function nombreDeCategoria(id, { plural = false } = {}) {
  const categoria = CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[0]
  return plural ? categoria.label : categoria.singular
}

/**
 * Si el local se muestra en la vitrina.
 *
 * Tiene que repartir con Capta y no estar apagado a mano desde el panel
 * (_settings.captaVitrina === false). Los locales de prueba se apagan asi.
 *
 * `cerrado` NO lo saca de la lista: un local cerrado se muestra igual, con el
 * cartel de cerrado, para que el cliente sepa que existe y a que hora abre.
 */
export function localVisibleEnVitrina(restaurant, { conMenu = true } = {}) {
  const ajustes = ajustesDelLocal(restaurant?.horarios)
  if (ajustes.deliveryCapta !== true) return false
  if (ajustes.captaVitrina === false) return false
  // Ojo: NO se mira restaurants.hace_delivery. Ese campo es el delivery PROPIO
  // del local (Racing lo tiene apagado y reparte con Capta igual): quien
  // reparte aca es Capta, y eso ya lo dice deliveryCapta.
  // Un local sin productos cargados abre un menu vacio.
  if (!conMenu) return false
  return true
}

/**
 * Lo que tarda en llegar, corto para la tarjeta.
 *
 * Los locales lo escriben como se les ocurre ("45 minutos", "20 a 30 min").
 * Se deja el numero y se unifica la palabra.
 */
export function tiempoDeEntrega(valor) {
  const crudo = String(valor ?? '').trim()
  if (!crudo) return ''

  const numeros = crudo.match(/\d+/g)
  if (!numeros || !numeros.length) return ''

  const desde = Number(numeros[0])
  const hasta = numeros[1] ? Number(numeros[1]) : null
  if (!Number.isFinite(desde) || desde <= 0) return ''

  return hasta && hasta > desde ? `${desde}-${hasta} min` : `${desde} min`
}

/** El envio mas barato de las zonas activas, para el "Envio desde $X". */
export function envioDesde(zonas) {
  const precios = (Array.isArray(zonas) ? zonas : [])
    .filter((zona) => zona?.active !== false)
    .map((zona) => Number(zona?.fee))
    .filter((precio) => Number.isFinite(precio) && precio > 0)

  return precios.length ? Math.min(...precios) : null
}

/** Para comparar ciudades escritas a mano: sin acentos, ni mayusculas, ni espacios de mas. */
export function ciudadPareja(ciudad) {
  return String(ciudad ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

/** Busqueda del cliente: entra por nombre, por categoria o por ciudad. */
export function localCoincideCon(local, busqueda) {
  const q = ciudadPareja(busqueda)
  if (!q) return true

  const campos = [local?.nombre, local?.categoriaNombre, local?.ciudad, ...(local?.etiquetas ?? [])]
  return campos.some((campo) => ciudadPareja(campo).includes(q))
}

export { CATEGORIAS }

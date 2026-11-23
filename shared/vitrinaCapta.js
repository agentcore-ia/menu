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
const CATEGORIAS_BASE = [
  { id: 'comida', label: 'Casas de comida', singular: 'Casa de comida' },
  { id: 'sushi', label: 'Sushi', singular: 'Sushi' },
  { id: 'restobar', label: 'Resto bares', singular: 'Resto bar' },
  { id: 'hamburgueseria', label: 'Hamburgueserías', singular: 'Hamburguesería' },
  { id: 'pizzeria', label: 'Pizzerías', singular: 'Pizzería' },
  { id: 'rotiseria', label: 'Rotiserías', singular: 'Rotisería' },
  { id: 'heladeria', label: 'Heladerías', singular: 'Heladería' },
  { id: 'panaderia', label: 'Panaderías', singular: 'Panadería' },
  { id: 'cafeteria', label: 'Cafeterías', singular: 'Cafetería' },
  { id: 'kiosco', label: 'Kioscos', singular: 'Kiosco' },
  { id: 'dietetica', label: 'Dietéticas', singular: 'Dietética' },
  { id: 'farmacia', label: 'Farmacias', singular: 'Farmacia' },
  { id: 'super', label: 'Supermercados', singular: 'Supermercado' },
  { id: 'licoreria', label: 'Licorerías', singular: 'Licorería' },
  { id: 'mascotas', label: 'Pet shops', singular: 'Pet shop' },
]

/**
 * Los cuadrados de "Categorías" del inicio: cada uno junta una o mas
 * categorias ("Comida" son las casas de comida, hamburgueserias, pizzerias...).
 * `mandado`: si no hay locales de eso en la ciudad, se ofrece comprarlo con un
 * mandado, empezando por ese lugar (src/MandadoCapta.jsx).
 */
const GRUPOS_BASE = [
  { id: 'comida', label: 'Comida', categorias: ['comida', 'hamburgueseria', 'pizzeria', 'rotiseria', 'cafeteria'], fondo: '#fdebde', circulo: '#fde9d9' },
  { id: 'sushi', label: 'Sushi', categorias: ['sushi'], fondo: '#fde4d6', circulo: '#fdeadf' },
  { id: 'restobar', label: 'Resto bar', categorias: ['restobar'], fondo: '#fbecd0', circulo: '#fdf0d6' },
  { id: 'super', label: 'Súper', categorias: ['super', 'dietetica'], fondo: '#fde8d4', circulo: '#e5f2e1', mandado: 'El supermercado más cercano' },
  { id: 'helados', label: 'Helados', categorias: ['heladeria'], fondo: '#fbdfd6', circulo: '#fde3e7' },
  { id: 'panaderia', label: 'Panadería', categorias: ['panaderia'], fondo: '#fce4c8', circulo: '#fdf0d9', mandado: 'La panadería más cercana' },
  { id: 'kioscos', label: 'Kioscos', categorias: ['kiosco'], fondo: '#fce7cd', circulo: '#fcebd2', mandado: 'El kiosco más cercano' },
  { id: 'farmacia', label: 'Farmacia', categorias: ['farmacia'], fondo: '#fbe9e9', circulo: '#e6edfb', mandado: 'La farmacia más cercana' },
  { id: 'licores', label: 'Bebidas', categorias: ['licoreria'], fondo: '#fdebdc', circulo: '#fbe8e6', mandado: 'La licorería más cercana' },
  { id: 'mascotas', label: 'Mascotas', categorias: ['mascotas'], fondo: '#fdebd1', circulo: '#fdeed6', mandado: 'El pet shop más cercano' },
]

// Las listas que usa el resto del codigo. Se modifican EN EL LUGAR (aplicarConfigVitrina) cuando el
// panel de admin cambia algo, asi cualquier archivo que las importo ve lo nuevo sin tocar nada.
const CATEGORIAS = CATEGORIAS_BASE.map((c) => ({ ...c }))
const GRUPOS = GRUPOS_BASE.map((g) => ({ ...g, categorias: [...g.categorias], imagen: '', visible: true }))

/** El grupo del inicio al que pertenece una categoria. */
export function grupoDeCategoria(categoria) {
  return GRUPOS.find((g) => g.categorias.includes(categoria)) ?? GRUPOS[0]
}

/** Los cuadrados que se dibujan en el inicio: los que el admin no oculto. */
export function gruposVisibles() {
  return GRUPOS.filter((g) => g.visible !== false)
}

let IDS = new Set(CATEGORIAS.map((c) => c.id))

// ---- Lo que se edita desde el panel de admin (Capta Delivery > Vitrina) ----------------------------

export const TEXTOS_BASE = {
  explora: 'Explorá',
  categorias: 'Categorías',
  buscador: 'Buscá qué pedir',
  promoHoy: 'Promo de hoy',
}
export const SECCIONES_BASE = { explora: true, categorias: true, promos: true }

const TEXTOS = { ...TEXTOS_BASE }
const SECCIONES = { ...SECCIONES_BASE }
let BANNERS = null // null = los de fabrica de cada ciudad

/** Un texto de la pantalla, con el que escribio el admin o el de fabrica. */
export function textoVitrina(clave) {
  return TEXTOS[clave] ?? TEXTOS_BASE[clave] ?? ''
}

/** Si una seccion del inicio se muestra. */
export function seccionVitrina(clave) {
  return SECCIONES[clave] !== false
}

/** Los banners elegidos por el admin, o null si se usan los de fabrica. */
export function bannersVitrina() {
  return BANNERS
}

const ID_VALIDO = /^[a-z0-9][a-z0-9-]{1,29}$/
const COLOR = /^#[0-9a-fA-F]{6}$/

function cadena(valor, max) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Una direccion de imagen o de link: https o una ruta del propio sitio. Nada de javascript:. */
function direccion(valor) {
  const v = String(valor ?? '').trim()
  if (!v || v.length > 600) return ''
  return /^https:\/\//i.test(v) || (v.startsWith('/') && !v.startsWith('//')) ? v : ''
}

/**
 * Deja la configuracion en una forma segura: cualquier cosa rara se descarta o se corrige. Es lo que
 * corren tanto el panel (al guardar) como el menu (al leer), asi una fila mal escrita nunca rompe la
 * pantalla.
 */
export function normalizarConfigVitrina(crudo) {
  const c = crudo && typeof crudo === 'object' && !Array.isArray(crudo) ? crudo : {}
  const salida = { categorias: null, grupos: null, banners: null, textos: {}, secciones: {} }

  if (Array.isArray(c.categorias)) {
    const vistos = new Set()
    salida.categorias = []
    for (const x of c.categorias.slice(0, 60)) {
      const id = cadena(x?.id, 30).toLowerCase()
      if (!ID_VALIDO.test(id) || vistos.has(id)) continue
      const label = cadena(x?.label, 40)
      const singular = cadena(x?.singular, 40) || label
      if (!label) continue
      vistos.add(id)
      salida.categorias.push({ id, label, singular })
    }
  }

  if (Array.isArray(c.grupos)) {
    const vistos = new Set()
    salida.grupos = []
    for (const x of c.grupos.slice(0, 30)) {
      const id = cadena(x?.id, 30).toLowerCase()
      const label = cadena(x?.label, 30)
      if (!ID_VALIDO.test(id) || vistos.has(id) || !label) continue
      vistos.add(id)
      const categorias = [...new Set((Array.isArray(x?.categorias) ? x.categorias : []).map((v) => cadena(v, 30).toLowerCase()).filter(Boolean))]
      const grupo = {
        id,
        label,
        categorias,
        imagen: direccion(x?.imagen),
        fondo: COLOR.test(String(x?.fondo ?? '')) ? String(x.fondo) : '#fdebde',
        circulo: COLOR.test(String(x?.circulo ?? '')) ? String(x.circulo) : '#fde9d9',
        visible: x?.visible !== false,
      }
      const mandado = cadena(x?.mandado, 60)
      if (mandado) grupo.mandado = mandado
      salida.grupos.push(grupo)
    }
  }

  if (Array.isArray(c.banners)) {
    salida.banners = []
    for (const x of c.banners.slice(0, 12)) {
      const imagen = direccion(x?.imagen)
      if (!imagen) continue
      salida.banners.push({
        id: cadena(x?.id, 40) || `banner-${salida.banners.length + 1}`,
        imagen,
        alt: cadena(x?.alt, 120),
        link: direccion(x?.link),
        activo: x?.activo !== false,
      })
    }
  }

  for (const clave of Object.keys(TEXTOS_BASE)) {
    const v = cadena(c.textos?.[clave], 60)
    if (v) salida.textos[clave] = v
  }
  for (const clave of Object.keys(SECCIONES_BASE)) {
    if (typeof c.secciones?.[clave] === 'boolean') salida.secciones[clave] = c.secciones[clave]
  }
  return salida
}

/**
 * Aplica la configuracion a las listas de arriba. Las categorias y cuadrados de fabrica nunca se
 * pierden (un local puede estar guardado en una): lo que el admin no nombra se conserva como esta.
 */
export function aplicarConfigVitrina(crudo) {
  const c = normalizarConfigVitrina(crudo)

  const categorias = []
  for (const x of c.categorias ?? []) categorias.push({ id: x.id, label: x.label, singular: x.singular })
  for (const x of CATEGORIAS_BASE) if (!categorias.some((y) => y.id === x.id)) categorias.push({ ...x })
  CATEGORIAS.splice(0, CATEGORIAS.length, ...categorias)
  IDS = new Set(CATEGORIAS.map((x) => x.id))

  const grupos = (c.grupos ?? GRUPOS_BASE.map((g) => ({ ...g, imagen: '', visible: true }))).map((g) => ({
    ...g,
    categorias: g.categorias.filter((id) => IDS.has(id)),
  }))
  // Un cuadrado sin categorias no lleva a ningun lado.
  GRUPOS.splice(0, GRUPOS.length, ...grupos.filter((g) => g.categorias.length > 0))
  if (GRUPOS.length === 0) {
    GRUPOS.push(...GRUPOS_BASE.map((g) => ({ ...g, categorias: [...g.categorias], imagen: '', visible: true })))
  }

  for (const k of Object.keys(TEXTOS)) delete TEXTOS[k]
  Object.assign(TEXTOS, TEXTOS_BASE, c.textos)
  for (const k of Object.keys(SECCIONES)) delete SECCIONES[k]
  Object.assign(SECCIONES, SECCIONES_BASE, c.secciones)
  BANNERS = c.banners
  return c
}

// Lo que cargo el local al darse de alta (restaurants.business_type) o lo que
// eligio despues en ajustes (_settings.rubro). "restaurant" y "otro" no dicen
// nada util: son el descarte y se resuelven mirando la plantilla del menu.
const POR_RUBRO = {
  heladeria: 'heladeria',
  sushi: 'sushi',
  panaderia: 'panaderia',
  cafeteria: 'cafeteria',
  kiosco: 'kiosco',
  dietetica: 'dietetica',
  farmacia: 'farmacia',
  rotiseria: 'rotiseria',
  pizzeria: 'pizzeria',
  hamburgueseria: 'hamburgueseria',
  restobar: 'restobar',
  'resto bar': 'restobar',
  'resto-bar': 'restobar',
  comercio: 'kiosco',
  super: 'super',
  supermercado: 'super',
  almacen: 'super',
  licoreria: 'licoreria',
  bebidas: 'licoreria',
  mascotas: 'mascotas',
  petshop: 'mascotas',
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

export { CATEGORIAS, GRUPOS }

/**
 * El tiempo de la tarjeta: el MEDIDO con las entregas de Capta (lo calcula el
 * dashboard, /api/public/tiempos-entrega) y, si el local tiene pocas, el que
 * escribio en Ajustes.
 */
export function tiempoParaVitrina(medido, declarado) {
  const desde = Number(medido?.desde)
  const hasta = Number(medido?.hasta)
  if (Number.isFinite(desde) && Number.isFinite(hasta) && desde > 0 && hasta > desde) {
    return { texto: `${desde}-${hasta} min`, medido: true }
  }
  const texto = tiempoDeEntrega(declarado)
  return { texto, medido: false }
}

/**
 * La promo del local en "Promos de hoy" (horarios._settings.captaPromo, la
 * carga Capta desde su panel). Se muestra hasta el ultimo dia inclusive, en
 * hora argentina. La misma regla esta en el dashboard (lib/promoVitrina.ts).
 */
export function promoVigente(promo, ahora = new Date()) {
  const texto = String(promo?.texto ?? '').replace(/\s+/g, ' ').trim()
  if (!texto) return null
  const hasta = String(promo?.hasta ?? '').trim()
  if (hasta) {
    const hoy = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
    if (hoy > hasta) return null
  }
  return texto.slice(0, 70)
}

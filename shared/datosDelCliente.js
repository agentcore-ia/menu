// La libreta del cliente: los datos que carga al hacer un pedido quedan
// guardados en SU telefono, para que la proxima vez el formulario ya venga
// completo y solo tenga que apretar enviar.
//
// Se guardan RECIEN cuando el pedido salio bien. Mientras escribe se puede
// arrepentir, borrar o equivocarse, y no tiene sentido recordar eso.
//
// Viven en el dispositivo y no en el servidor: es la libreta del cliente, no
// una base de datos nuestra. Por eso tambien se borran de un toque.

const CLAVE = 'capta-datos-cliente'
const VERSION = 1

// Un ano sin pedir nada: lo que quedo guardado ya no dice donde vive.
const VENCE_EN_DIAS = 365
const DIA = 24 * 60 * 60 * 1000

const ENTREGAS = ['delivery', 'retiro']
const PAGOS = ['cash', 'transferencia', 'mercado_pago']

const CAMPOS = ['name', 'phone', 'address', 'neighborhood']

function texto(valor, max = 160) {
  return String(valor ?? '').trim().slice(0, max)
}

/** Para comparar direcciones escritas a mano: sin acentos, ni mayusculas, ni dobles espacios. */
function parejo(valor) {
  return texto(valor)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function numero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

/**
 * El localStorage del navegador, o null.
 *
 * Puede no existir (render en el servidor) o tirar error (Safari en privado,
 * cookies bloqueadas). En ese caso el menu funciona igual, solo que sin
 * recordar nada.
 */
export function almacenDelNavegador() {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage ?? null
  } catch {
    return null
  }
}

/** Las coordenadas de la ultima direccion confirmada, si son usables. */
function coordenadas(dato) {
  if (!dato || typeof dato !== 'object') return null
  const lat = numero(dato.lat)
  const lng = numero(dato.lng)
  if (lat === null || lng === null) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return {
    lat,
    lng,
    label: texto(dato.label),
    direccion: texto(dato.direccion),
    barrio: texto(dato.barrio),
    ciudad: texto(dato.ciudad),
  }
}

/** Lo que haya guardado en este dispositivo, ya normalizado, o null. */
export function leerDatos(storage, ahora = Date.now()) {
  let crudo = null
  try {
    crudo = storage?.getItem(CLAVE) ?? null
  } catch {
    return null
  }
  if (!crudo) return null

  let dato = null
  try {
    dato = JSON.parse(crudo)
  } catch {
    return null
  }
  if (!dato || typeof dato !== 'object' || dato.v !== VERSION) return null

  const guardadoEn = numero(dato.guardadoEn) ?? 0
  // Si el reloj del telefono esta atrasado la resta da negativa: eso no es
  // vencido, es un reloj mal puesto.
  if (!guardadoEn || ahora - guardadoEn > VENCE_EN_DIAS * DIA) return null

  const datos = {
    name: texto(dato.name, 80),
    phone: texto(dato.phone, 40),
    address: texto(dato.address),
    neighborhood: texto(dato.neighborhood, 80),
    deliveryType: ENTREGAS.includes(dato.deliveryType) ? dato.deliveryType : '',
    paymentMethod: PAGOS.includes(dato.paymentMethod) ? dato.paymentMethod : '',
    coordenadas: coordenadas(dato.coordenadas),
    guardadoEn,
  }

  // Sin nada con lo que completar el formulario, es como no tener nada.
  if (!datos.name && !datos.phone && !datos.address) return null
  return datos
}

/**
 * Guarda los datos del pedido que se acaba de enviar.
 *
 * Un pedido en la mesa no trae direccion ni tipo de entrega: en ese caso se
 * actualiza el nombre y el celular, y NO se pisa la direccion que el cliente
 * haya dejado la ultima vez que pidio a su casa.
 */
export function guardarDatos(storage, form, opciones = {}) {
  const { esMesa = false, ciudad = '', coordenadas: coords = null, ahora = Date.now() } = opciones
  const previo = leerDatos(storage, ahora)

  const datos = {
    v: VERSION,
    guardadoEn: ahora,
    name: texto(form?.name, 80) || previo?.name || '',
    phone: texto(form?.phone, 40) || previo?.phone || '',
    address: previo?.address || '',
    neighborhood: previo?.neighborhood || '',
    deliveryType: previo?.deliveryType || '',
    paymentMethod: previo?.paymentMethod || '',
    coordenadas: previo?.coordenadas || null,
  }

  if (!esMesa) {
    datos.address = texto(form?.address)
    datos.neighborhood = texto(form?.neighborhood, 80)
    datos.deliveryType = ENTREGAS.includes(form?.deliveryType) ? form.deliveryType : ''
    datos.paymentMethod = PAGOS.includes(form?.paymentMethod) ? form.paymentMethod : ''

    // Las coordenadas valen para ESA direccion en ESA ciudad. Si despues
    // escribe otra cosa dejan de aplicar, y por eso se guardan con ella.
    const punto = coordenadas({
      ...(coords || {}),
      direccion: datos.address,
      barrio: datos.neighborhood,
      ciudad: texto(ciudad, 80),
    })
    datos.coordenadas = datos.address ? punto : null
  }

  if (!datos.name && !datos.phone && !datos.address) return null

  try {
    storage?.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    // Sin lugar para guardar (modo privado, cuota llena) el pedido ya salio:
    // no recordarlo no es motivo para romperle nada al cliente.
    return null
  }

  return leerDatos(storage, ahora)
}

/** Borra la libreta. */
export function olvidarDatos(storage) {
  try {
    storage?.removeItem(CLAVE)
  } catch {
    // Nada que borrar si no hay donde guardar.
  }
}

/**
 * El formulario de siempre, completado con lo que haya guardado.
 *
 * En la mesa el tipo de entrega lo manda el QR, no lo que el cliente eligio la
 * ultima vez que pidio a su casa.
 */
export function prellenarFormulario(base, guardados, opciones = {}) {
  if (!guardados) return base
  const { esMesa = false } = opciones
  const form = { ...base }

  for (const campo of CAMPOS) {
    if (guardados[campo]) form[campo] = guardados[campo]
  }
  if (guardados.paymentMethod) form.paymentMethod = guardados.paymentMethod
  if (!esMesa && guardados.deliveryType) form.deliveryType = guardados.deliveryType

  return form
}

/**
 * Las coordenadas guardadas, solo si son de la direccion que hay escrita
 * ahora. Sirven para que la direccion que volvio sola ya salga con el envio
 * calculado, sin pedirle otra vez que la confirme de la lista.
 *
 * La misma calle en otra ciudad es otro lugar: por eso tambien compara ciudad.
 */
export function coordenadasGuardadas(guardados, form, ciudad) {
  const punto = guardados?.coordenadas
  if (!punto) return null
  if (parejo(punto.direccion) !== parejo(form?.address)) return null
  if (parejo(punto.barrio) !== parejo(form?.neighborhood)) return null
  if (parejo(punto.ciudad) !== parejo(ciudad)) return null
  return { lat: punto.lat, lng: punto.lng, label: punto.label }
}

/** Si hay algo guardado que se pueda mostrar como "tus datos". */
export function hayDatosGuardados(guardados) {
  return Boolean(guardados && CAMPOS.some((campo) => guardados[campo]))
}

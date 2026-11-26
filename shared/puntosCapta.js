// Los puntos de Capta Delivery, del lado del menu.
//
// El cliente los junta pidiendo desde la app (menu.net.ar/pedi) y los usa como
// descuento en pesos en cualquier local de la lista. El descuento lo pone
// CAPTA, no el negocio: el local cobra lo mismo que si el cliente hubiera
// pagado todo.
//
// GEMELO de `lib/puntosCaptaReglas.ts` del dashboard, que es donde se acreditan
// los puntos. Aca esta SOLO la parte del canje, que es lo que necesita el
// checkout. Si se cambia una cuenta, se cambia en los dos lados.
//
//   node --test shared/puntosCapta.test.mjs

/** La comision que Capta le cobra al local. Gemelo de TASA_COMISION_CAPTA. */
export const TASA_COMISION = 0.05

export const CONFIG_POR_DEFECTO = {
  activo: false,
  pesosPorPunto: 100,
  valorDelPunto: 2,
  minimoParaCanjear: 250,
  topePorPedido: 3000,
}

function num(valor, porDefecto = 0) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : porDefecto
}

/**
 * La config como la manda el servidor (en snake_case, como la tabla) o como ya
 * la tiene la pantalla. Se aceptan las dos para no tener que traducir en cada
 * pasada.
 */
export function configDePuntos(cruda) {
  const c = cruda ?? {}
  const tomar = (a, b, porDefecto) => {
    const valor = c[a] !== undefined ? c[a] : c[b]
    return valor === undefined ? porDefecto : valor
  }

  return {
    activo: tomar('activo', 'activo', false) === true,
    pesosPorPunto: Math.max(1, Math.round(num(tomar('pesosPorPunto', 'pesos_por_punto'), CONFIG_POR_DEFECTO.pesosPorPunto))),
    valorDelPunto: Math.max(1, Math.round(num(tomar('valorDelPunto', 'valor_del_punto'), CONFIG_POR_DEFECTO.valorDelPunto))),
    minimoParaCanjear: Math.max(0, Math.round(num(tomar('minimoParaCanjear', 'minimo_para_canjear'), CONFIG_POR_DEFECTO.minimoParaCanjear))),
    topePorPedido: Math.max(0, Math.round(num(tomar('topePorPedido', 'tope_por_pedido'), CONFIG_POR_DEFECTO.topePorPedido))),
  }
}

/** Lo que Capta gana en ese pedido: de ahi sale el descuento y no de otro lado. */
export function loQueGanaCapta(comida, envio) {
  return Math.round(Math.max(0, num(comida)) * TASA_COMISION) + Math.max(0, Math.round(num(envio)))
}

/**
 * Cuanto puede descontar este cliente en ESTE pedido.
 *
 * Se queda con el mas chico de todos los topes y lo redondea para abajo a
 * puntos enteros.
 */
export function canjePosible({ puntos, comida, envio }, config) {
  const c = configDePuntos(config)
  const tiene = Math.max(0, Math.floor(num(puntos)))
  const plata = Math.max(0, Math.round(num(comida)))
  const flete = Math.max(0, Math.round(num(envio)))

  if (!c.activo) return { pesos: 0, puntos: 0, motivo: 'apagado' }
  if (tiene <= 0) return { pesos: 0, puntos: 0, motivo: 'sin_puntos' }
  if (tiene < c.minimoParaCanjear) return { pesos: 0, puntos: 0, motivo: 'sin_minimo' }

  const porPuntos = tiene * c.valorDelPunto
  const porCapta = loQueGanaCapta(plata, flete)
  const porConfig = c.topePorPedido > 0 ? c.topePorPedido : Number.POSITIVE_INFINITY
  const tope = Math.min(porPuntos, porCapta, porConfig, plata)
  if (tope <= 0) return { pesos: 0, puntos: 0, motivo: porCapta <= 0 ? 'tope_capta' : 'tope_pedido' }

  const puntosUsados = Math.floor(tope / c.valorDelPunto)
  const pesos = puntosUsados * c.valorDelPunto
  if (pesos <= 0) return { pesos: 0, puntos: 0, motivo: 'tope_pedido' }

  const motivo = pesos >= porPuntos ? '' : porCapta <= porConfig ? 'tope_capta' : 'tope_pedido'
  return { pesos, puntos: puntosUsados, motivo }
}

/** El descuento que eligio el cliente, siempre dentro de lo posible. */
export function canjeElegido(pedido, pesosPedidos, config) {
  const c = configDePuntos(config)
  const maximo = canjePosible(pedido, c)
  if (maximo.pesos <= 0) return maximo

  const pedidos = Math.max(0, Math.round(num(pesosPedidos)))
  if (pedidos >= maximo.pesos) return maximo

  const puntos = Math.floor(pedidos / c.valorDelPunto)
  const pesos = puntos * c.valorDelPunto
  if (pesos <= 0) return { pesos: 0, puntos: 0, motivo: 'sin_minimo' }
  return { pesos, puntos, motivo: '' }
}

/** Como se le cuenta al cliente lo que tiene. */
export function enPesos(puntos, config) {
  return Math.max(0, Math.floor(num(puntos))) * configDePuntos(config).valorDelPunto
}

/** El texto de por que no puede usar mas, para decirselo sin tecnicismos. */
export function porQueNoEntraTodo(motivo, config) {
  const c = configDePuntos(config)
  if (motivo === 'sin_minimo') return `Necesitás ${c.minimoParaCanjear} puntos para empezar a usarlos.`
  if (motivo === 'tope_pedido') return `Por pedido se puede usar hasta $${c.topePorPedido.toLocaleString('es-AR')}.`
  if (motivo === 'tope_capta') return 'Es lo máximo que entra en este pedido.'
  return ''
}

// ------------------------------------------------------------------ puntos de regalo
//
// Ademas del saldo comun, un cliente puede tener puntos REGALADOS (tabla capta_puntos_bonos): valen
// en todos los locales o solo en algunos locales o productos, y cada regalo dice quien lo paga.
//   - Se usan antes que el saldo comun, primero los mas especificos y los que vencen antes.
//   - No piden el minimo para canjear.
//   - Lo que paga Capta (comun o regalo) nunca supera lo que Capta gana en ese pedido; lo que paga el
//     local solo tiene el limite de lo que cuestan los productos.

const texto = (v) => String(v ?? '')

function seAplica(regalo, locales, ahora) {
  if (!(num(regalo.restantes) > 0)) return false
  if (regalo.venceAt && Date.parse(regalo.venceAt) < ahora) return false
  const donde = (regalo.locales || []).map(texto)
  return donde.length === 0 || donde.some((d) => locales.includes(d))
}

const especificidad = (r) => ((r.productos || []).length ? 0 : (r.locales || []).length ? 1 : 2)
const vencimiento = (r) => (r.venceAt ? Date.parse(r.venceAt) : Number.POSITIVE_INFINITY)

/**
 * Cuanto se puede descontar en este pedido juntando regalos y saldo comun.
 *
 * `local`: como se puede nombrar al local (su id, su direccion). `items`: [{ productId, unitPrice,
 * quantity }]. `pesosPedidos`: lo que pidio usar el cliente (sin pasarlo: todo lo posible).
 */
export function canjeConRegalos({ puntos, regalos = [], local = [], items = [], comida, envio, ahora = Date.now() }, config, pesosPedidos) {
  const c = configDePuntos(config)
  const v = c.valorDelPunto
  const plata = Math.max(0, Math.round(num(comida)))
  const nombres = (Array.isArray(local) ? local : [local]).map(texto).filter(Boolean)

  let quedaComida = plata
  let quedaCapta = loQueGanaCapta(plata, envio)
  // Lo que queda sin descontar de cada producto del pedido.
  const porProducto = new Map()
  for (const i of items || []) {
    const id = texto(i.productId)
    if (id) porProducto.set(id, (porProducto.get(id) || 0) + Math.max(0, num(i.unitPrice)) * Math.max(1, num(i.quantity, 1)))
  }

  const usados = []
  const candidatos = regalos
    .filter((r) => seAplica(r, nombres, ahora))
    .sort((a, b) => especificidad(a) - especificidad(b) || vencimiento(a) - vencimiento(b))
  for (const r of candidatos) {
    const productos = (r.productos || []).map(texto)
    const deSusProductos = productos.reduce((t, id) => t + (porProducto.get(id) || 0), 0)
    const paga = r.paga === 'local' ? 'local' : 'capta'
    let tope = Math.min(num(r.restantes) * v, quedaComida)
    if (productos.length) tope = Math.min(tope, deSusProductos)
    if (paga === 'capta') tope = Math.min(tope, quedaCapta)
    const cuantos = Math.floor(tope / v)
    if (cuantos <= 0) continue
    const pesos = cuantos * v
    usados.push({ id: r.id, puntos: cuantos, pesos, paga })
    quedaComida -= pesos
    if (paga === 'capta') quedaCapta -= pesos
    let porRestar = pesos
    for (const id of productos.length ? productos : [...porProducto.keys()]) {
      const resta = Math.min(porRestar, porProducto.get(id) || 0)
      porProducto.set(id, (porProducto.get(id) || 0) - resta)
      porRestar -= resta
    }
  }

  // El saldo comun, sobre lo que quedo. Con sus reglas de siempre.
  const tiene = Math.max(0, Math.floor(num(puntos)))
  let comun = { puntos: 0, pesos: 0 }
  if (c.activo && tiene > 0 && tiene >= c.minimoParaCanjear) {
    const tope = Math.min(tiene * v, quedaComida, quedaCapta, c.topePorPedido > 0 ? c.topePorPedido : Number.POSITIVE_INFINITY)
    const cuantos = Math.max(0, Math.floor(tope / v))
    comun = { puntos: cuantos, pesos: cuantos * v }
  }

  // Si pidio usar menos, se recorta primero el saldo comun y despues los ultimos regalos.
  if (pesosPedidos !== undefined) {
    const quiere = Math.max(0, Math.round(num(pesosPedidos)))
    let sobra = comun.pesos + usados.reduce((t, u) => t + u.pesos, 0) - quiere
    for (const tramo of [comun, ...[...usados].reverse()]) {
      if (sobra <= 0) break
      const nuevos = Math.max(0, Math.floor((tramo.pesos - sobra) / v))
      sobra -= tramo.pesos - nuevos * v
      tramo.puntos = nuevos
      tramo.pesos = nuevos * v
    }
  }

  const deRegalo = usados.filter((u) => u.pesos > 0)
  const pesosLocal = deRegalo.filter((u) => u.paga === 'local').reduce((t, u) => t + u.pesos, 0)
  const pesosCapta = comun.pesos + deRegalo.filter((u) => u.paga === 'capta').reduce((t, u) => t + u.pesos, 0)
  const pesos = pesosCapta + pesosLocal
  const motivo = candidatos.length === 0 ? canjePosible({ puntos, comida, envio }, config).motivo : ''
  return {
    pesos,
    puntos: comun.puntos + deRegalo.reduce((t, u) => t + u.puntos, 0),
    pesosCapta,
    pesosLocal,
    comun,
    regalos: deRegalo,
    motivo,
  }
}

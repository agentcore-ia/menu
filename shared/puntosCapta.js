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

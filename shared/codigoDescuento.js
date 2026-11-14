// Codigos de descuento de las campañas del LOCAL (reactivacion y post-compra).
//
// Los genera el dashboard al mandar el mensaje (lib/codigosDescuento.ts): uno por cliente, vale una
// sola vez y vence segun la vigencia configurada en Campañas. Aca estan las reglas del canje, puras,
// para que el checkout y el servidor digan lo mismo. El descuento lo pone el local, no Capta.

/** Como lo escribio el cliente -> como esta guardado (mayusculas, sin espacios ni guiones). */
export function normalizarCodigoLocal(crudo) {
  return String(crudo ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24)
}

// Un pedido que quedo esperando el pago de Mercado Pago y nunca se pago no "gasto" el codigo: pasado
// este rato se puede volver a usar.
export const ESPERA_DEL_PAGO_MS = 2 * 60 * 60 * 1000

// El codigo se toma un instante ANTES de crear el pedido (todavia sin pedido anotado). Mientras dure
// ese instante no esta libre: si no, dos pedidos a la vez lo usarian los dos.
export const GRACIA_SIN_PEDIDO_MS = 5 * 60 * 1000

/**
 * ¿El codigo ya usado quedo libre otra vez? Solo si el pedido donde se uso se cancelo, se borro, o
 * quedo sin pagar mas de ESPERA_DEL_PAGO_MS.
 * pedido: { status } | null (null = no tiene pedido: se borro, o se esta creando ahora mismo).
 */
export function seLibero(fila, pedido, ahora = Date.now()) {
  if (!fila?.usado_at) return false
  if (!pedido) return ahora - Date.parse(fila.usado_at) > GRACIA_SIN_PEDIDO_MS
  if (pedido.status === 'cancelled') return true
  if (pedido.status === 'pendiente_pago') {
    return ahora - Date.parse(fila.usado_at) > ESPERA_DEL_PAGO_MS
  }
  return false
}

/**
 * Por que NO se puede usar (texto para el cliente), o '' si se puede.
 * fila: la fila de codigos_descuento. pedido: el pedido donde se uso, si ya se uso.
 */
export function motivoCodigoNoAplica(fila, { pedido = null, comida = 0, ahora = Date.now() } = {}) {
  if (!fila) return 'Ese código no existe.'
  const vence = Date.parse(fila.vence_at)
  if (!Number.isFinite(vence) || vence < ahora) return 'Ese código ya venció.'
  if (fila.usado_at && !seLibero(fila, pedido, ahora)) return 'Ese código ya se usó.'
  if (!(Number(comida) > 0)) return 'Agregá productos para usar el código.'
  return ''
}

/** Cuanta plata descuenta: el porcentaje sobre la comida (el envio no entra). */
export function descuentoDelCodigo(fila, comida) {
  const porcentaje = Math.min(Math.max(Number(fila?.porcentaje) || 0, 0), 100)
  const base = Math.max(0, Number(comida) || 0)
  return Math.min(base, Math.round((base * porcentaje) / 100))
}

/** Lo que se lee en el pedido del local: "Código ABCD2345 (10%)". */
export function etiquetaDelCodigo(fila) {
  return `Código ${fila.codigo} (${Number(fila.porcentaje)}%)`
}

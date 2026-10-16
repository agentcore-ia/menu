// Cupones de Capta Delivery, del lado del menu.
//
// Los crea el admin de Capta (dashboard: Admin > Delivery > Cupones) y los paga
// CAPTA: el cliente paga menos y el local cobra lo mismo, igual que con los
// puntos. Solo valen en pedidos que entran desde la app (delivery.capta.ar).
//
// GEMELO de `lib/cuponesCapta.ts` del dashboard. Si se cambia una cuenta, se
// cambia en los dos lados.

const num = (valor, porDefecto = 0) => {
  const n = Number(valor)
  return Number.isFinite(n) ? n : porDefecto
}

/** El codigo como lo escribe el cliente: mayusculas, sin espacios ni signos raros. */
export function normalizarCodigo(crudo) {
  return String(crudo ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 24)
}

/** Cuantos pesos descuenta este cupon en este pedido (entero, nunca mas que el pedido). */
export function descuentoDelCupon(cupon, { comida, envio }) {
  const c = Math.max(0, num(comida))
  const e = Math.max(0, num(envio))
  const total = c + e
  let pesos = 0

  if (cupon.tipo === 'porcentaje') pesos = Math.round((c * num(cupon.valor)) / 100)
  else if (cupon.tipo === 'monto') pesos = Math.round(num(cupon.valor))
  else if (cupon.tipo === 'envio_gratis') pesos = e

  const tope = cupon.tope_descuento == null ? null : Math.round(num(cupon.tope_descuento))
  if (tope !== null && tope >= 0) pesos = Math.min(pesos, tope)
  return Math.max(0, Math.min(pesos, total))
}

/** Por que este cupon NO entra en este pedido, o null si entra. */
export function motivoNoAplica(cupon, ctx) {
  const ahora = ctx.ahora ?? Date.now()
  if (!cupon.activo) return 'Este cupón no está activo.'
  if (cupon.desde && Date.parse(cupon.desde) > ahora) return 'Este cupón todavía no empezó.'
  if (cupon.hasta && Date.parse(cupon.hasta) < ahora) return 'Este cupón venció.'

  const locales = Array.isArray(cupon.restaurant_ids) ? cupon.restaurant_ids : []
  if (locales.length && ctx.restaurantId && !locales.includes(ctx.restaurantId)) {
    return 'Este cupón no vale en este local.'
  }
  if (cupon.max_usos_total != null && num(cupon.usos_total) >= cupon.max_usos_total) return 'Este cupón ya se agotó.'
  if ((ctx.usosDelCliente ?? 0) >= Math.max(1, num(cupon.max_usos_por_cliente, 1))) return 'Ya usaste este cupón.'
  if (cupon.requiere_cuenta && !ctx.cuentaVerificada) return 'Para usar este cupón entrá a tu cuenta con tu celular.'
  if (cupon.solo_primer_pedido && ctx.esPrimerPedido === false) return 'Este cupón es solo para tu primer pedido.'
  if (num(ctx.comida) < num(cupon.minimo_compra)) {
    return `Sumá más productos: el cupón pide una compra mínima de $${Math.round(num(cupon.minimo_compra)).toLocaleString('es-AR')}.`
  }
  if (descuentoDelCupon(cupon, { comida: ctx.comida, envio: ctx.envio }) <= 0) return 'Este cupón no descuenta nada en este pedido.'
  return null
}

/** El cartel corto del cupon: "30% OFF", "$2.000 OFF", "Envío gratis". */
export function textoDelCupon(cupon) {
  if (cupon.tipo === 'porcentaje') return `${Math.round(num(cupon.valor))}% OFF`
  if (cupon.tipo === 'monto') return `$${Math.round(num(cupon.valor)).toLocaleString('es-AR')} OFF`
  return 'Envío gratis'
}

/** Lo que se le muestra al cliente de un cupon: nada interno (usos, locales...). */
export function cuponParaElCliente(cupon, extra = {}) {
  return {
    codigo: cupon.codigo,
    titulo: cupon.titulo,
    descripcion: cupon.descripcion || '',
    tipo: cupon.tipo,
    texto: textoDelCupon(cupon),
    minimoCompra: Math.round(num(cupon.minimo_compra)),
    hasta: cupon.hasta || null,
    soloPrimerPedido: cupon.solo_primer_pedido === true,
    requiereCuenta: cupon.requiere_cuenta === true,
    color: cupon.color || null,
    ...extra,
  }
}

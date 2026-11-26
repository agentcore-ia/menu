// Cupones de Capta Delivery, del lado del menu.
//
// Los crea el admin de Capta (dashboard: Admin > Delivery > Cupones) y los paga
// CAPTA: el cliente paga menos y el local cobra lo mismo, igual que con los
// puntos. Solo valen en pedidos que entran desde la app (capta.ar).
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
export function descuentoDelCupon(cupon, { comida, envio, items }) {
  const c = Math.max(0, num(comida))
  const e = Math.max(0, num(envio))
  const total = c + e
  let pesos = 0

  // Con productos elegidos, el porcentaje o el monto salen solo de lo que cuestan esos productos.
  const elegidos = productosDelCupon(cupon)
  const base = elegidos.length ? Math.min(c, loQueCuestan(items, elegidos)) : c
  if (cupon.tipo === 'porcentaje') pesos = Math.round((base * num(cupon.valor)) / 100)
  else if (cupon.tipo === 'monto') pesos = elegidos.length ? Math.min(Math.round(num(cupon.valor)), Math.round(base)) : Math.round(num(cupon.valor))
  else if (cupon.tipo === 'envio_gratis') pesos = e
  else if (cupon.tipo === 'producto') {
    // Una unidad del producto: lo que cuesta en este pedido. Sin el producto, nada.
    const linea = (items || []).find((i) => cupon.producto_id && String(i.productId || '') === String(cupon.producto_id))
    pesos = linea ? Math.round(Math.max(0, num(linea.unitPrice))) : 0
  }

  const tope = cupon.tope_descuento == null ? null : Math.round(num(cupon.tope_descuento))
  if (tope !== null && tope >= 0) pesos = Math.min(pesos, tope)
  return Math.max(0, Math.min(pesos, total))
}

/** Los productos sobre los que vale un descuento (vacio = todo el pedido). */
export function productosDelCupon(cupon) {
  if (cupon.tipo !== 'porcentaje' && cupon.tipo !== 'monto') return []
  return Array.isArray(cupon.producto_ids) ? cupon.producto_ids.filter(Boolean).map(String) : []
}

/** Cuanto suman en el pedido las lineas de esos productos. */
export function loQueCuestan(items, productos) {
  const set = new Set(productos.map(String))
  return (items || []).reduce(
    (total, i) => (set.has(String(i.productId || '')) ? total + Math.max(0, num(i.unitPrice)) * Math.max(1, num(i.quantity, 1)) : total),
    0,
  )
}

/** Por que este cupon NO entra en este pedido, o null si entra. */
export function motivoNoAplica(cupon, ctx) {
  const ahora = ctx.ahora ?? Date.now()
  if (!cupon.activo) return 'Este cupón no está activo.'
  // Los regalos de puntos no se usan con codigo: se suman solos a la cuenta.
  if (cupon.tipo === 'puntos') return 'Esos puntos se suman a tu cuenta: no se usan con código.'
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
  if (cupon.tipo === 'producto' && descuentoDelCupon(cupon, { comida: ctx.comida, envio: ctx.envio, items: ctx.items }) <= 0) {
    return `Para usar este cupón agregá ${cupon.producto_nombre || 'el producto'} a tu pedido.`
  }
  const elegidos = productosDelCupon(cupon)
  if (elegidos.length && loQueCuestan(ctx.items, elegidos) <= 0) {
    return `Para usar este cupón agregá ${cupon.productos_nombre || 'alguno de sus productos'} a tu pedido.`
  }
  if (descuentoDelCupon(cupon, { comida: ctx.comida, envio: ctx.envio, items: ctx.items }) <= 0) return 'Este cupón no descuenta nada en este pedido.'
  return null
}

/** El cartel corto del cupon: "30% OFF", "$2.000 OFF", "Envío gratis". */
export function textoDelCupon(cupon) {
  const en = productosDelCupon(cupon).length ? ` en ${cupon.productos_nombre || 'productos elegidos'}` : ''
  if (cupon.tipo === 'puntos') return `${Math.round(num(cupon.valor)).toLocaleString('es-AR')} puntos`
  if (cupon.tipo === 'porcentaje') return `${Math.round(num(cupon.valor))}% OFF${en}`
  if (cupon.tipo === 'monto') return `$${Math.round(num(cupon.valor)).toLocaleString('es-AR')} OFF${en}`
  if (cupon.tipo === 'producto') return `${cupon.producto_nombre || 'Producto'} gratis`
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

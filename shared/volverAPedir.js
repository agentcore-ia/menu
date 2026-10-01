// "Volver a pedir": el ultimo pedido de cada local queda guardado en el
// TELEFONO del cliente (como sus datos, shared/datosDelCliente.js) y la
// vitrina de Capta Delivery lo ofrece de nuevo con un toque.
//
// Al repetirlo, el carrito se arma con lo que el local tiene HOY: precio de
// hoy, sin lo que ya no existe o no hay. Nunca se manda un pedido viejo tal
// cual: el cliente lo ve en el carrito y lo confirma.
//
//   node --test shared/volverAPedir.test.mjs

const CLAVE = 'capta-ultimos-pedidos'
/** Locales que se recuerdan (uno por local, el mas nuevo). */
const MAX_LOCALES = 6
/** Un pedido de hace mas que esto ya no es "el de siempre". */
const DIAS_QUE_VALE = 60
const DIA = 24 * 3600 * 1000

function leer(almacen) {
  try {
    const lista = JSON.parse(almacen?.getItem(CLAVE) || '[]')
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

/**
 * Guarda el pedido recien hecho. `lineas`: { id, nombre, cantidad, unitPrice,
 * base, notes } — base es el precio del producto sin opciones en ese momento,
 * para recalcular las opciones si el precio cambia.
 */
export function guardarUltimoPedido(almacen, pedido, ahora = Date.now()) {
  const slug = String(pedido?.slug || '').trim()
  const lineas = (Array.isArray(pedido?.lineas) ? pedido.lineas : [])
    .filter((l) => l && l.id !== undefined && l.id !== null && Number(l.cantidad) > 0)
    .slice(0, 40)
  if (!slug || !lineas.length) return
  const nuevo = { slug, nombre: String(pedido.nombre || ''), at: ahora, lineas }
  const resto = leer(almacen).filter((p) => p?.slug !== slug)
  try {
    almacen?.setItem(CLAVE, JSON.stringify([nuevo, ...resto].slice(0, MAX_LOCALES)))
  } catch {
    // Sin almacenamiento (modo privado): no hay "volver a pedir", nada mas.
  }
}

/** Los ultimos pedidos que todavia valen, del mas nuevo al mas viejo. */
export function leerUltimosPedidos(almacen, ahora = Date.now()) {
  return leer(almacen)
    .filter((p) => p?.slug && Array.isArray(p.lineas) && p.lineas.length && ahora - Number(p.at) <= DIAS_QUE_VALE * DIA)
    .sort((a, b) => Number(b.at) - Number(a.at))
}

export function ultimoPedidoDe(almacen, slug, ahora = Date.now()) {
  return leerUltimosPedidos(almacen, ahora).find((p) => p.slug === slug) ?? null
}

/** "2× Hamburguesa doble, 1× Papas y 2 más". */
export function resumenDelPedido(pedido, cuantos = 2) {
  const lineas = Array.isArray(pedido?.lineas) ? pedido.lineas : []
  const partes = lineas.slice(0, cuantos).map((l) => `${l.cantidad}× ${l.nombre}`)
  const resto = lineas.length - cuantos
  return resto > 0 ? `${partes.join(', ')} y ${resto} más` : partes.join(', ')
}

/**
 * Arma el carrito de nuevo con el menu de HOY.
 *
 * `items`: los productos del menu como los tiene la pantalla. `precioBase`:
 * como saca la pantalla el precio de un producto. Devuelve las lineas que se
 * pueden pedir y los nombres de las que no.
 */
export function rearmarCarrito(pedido, items, precioBase) {
  const lineas = []
  const faltan = []
  for (const l of Array.isArray(pedido?.lineas) ? pedido.lineas : []) {
    const item = (items || []).find((i) => String(i?.id) === String(l.id))
    const max = typeof item?.maxQuantity === 'number' ? item.maxQuantity : null
    if (!item || item.availableForOrder === false || item.soloEleccion || item.fueraDeHorario || max === 0) {
      faltan.push(String(l.nombre || item?.name || 'Un producto'))
      continue
    }
    const base = Number(precioBase(item))
    const conOpciones = Boolean(String(l.notes || '').trim())
    // Con opciones se respeta lo que sumaban (extras, tamaño) y se le aplica
    // el cambio de precio del producto. Sin opciones manda el precio de hoy.
    let unitPrice = conOpciones && Number.isFinite(Number(l.base)) && Number.isFinite(Number(l.unitPrice))
      ? Number(l.unitPrice) + (base - Number(l.base))
      : base
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) unitPrice = base
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      faltan.push(String(l.nombre || item.name))
      continue
    }
    const cantidad = Math.max(1, Math.floor(Number(l.cantidad) || 1))
    lineas.push({
      item,
      cantidad: max !== null ? Math.min(cantidad, max) : cantidad,
      unitPrice,
      notes: String(l.notes || ''),
    })
  }
  return { lineas, faltan }
}

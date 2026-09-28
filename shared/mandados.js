// Los mandados de Capta Delivery: el cliente pide algo que no esta en ningun
// menu ("comprame un cargador en el kiosco", "llevale estas llaves a mi vieja")
// y un repartidor de Capta lo hace. Como los "Favores" de Rappi.
//
// Como se arma: en cada ciudad hay UN local de Capta marcado como "de mandados"
// (restaurants.horarios._settings.captaMandados = true). Cada mandado es un
// pedido de ese local, asi entra al despacho, a la app del repartidor, al
// seguimiento y a la caja igual que cualquier envio. Ese local no sale en la
// vitrina como un comercio mas: tiene su propia entrada.
//
// La plata:
//   - El pedido vale SOLO el envio (por zona, como cualquier envio de Capta).
//   - En una compra el repartidor ADELANTA la plata (hasta el tope que puso el
//     cliente) y al entregar cobra el ticket aparte. Esa plata es suya: no se
//     rinde, por eso no entra en el total del pedido.
//   - Por ahora solo efectivo: con transferencia no hay a quien devolverle lo
//     que adelanto el repartidor.
//
// Este archivo no tiene pantalla ni base: lo usan la creacion del pedido (que
// es la que manda) y el formulario de la vitrina.
//
//   node --test shared/mandados.test.mjs

export const TIPOS_MANDADO = [
  { id: 'compra', label: 'Comprar algo', detalle: 'Te lo compramos y te lo llevamos' },
  { id: 'paquete', label: 'Llevar un paquete', detalle: 'Lo retiramos y lo entregamos' },
]

/** Lo maximo que adelanta un repartidor si el local de mandados no dice otra cosa. */
export const TOPE_COMPRA_POR_DEFECTO = 30000

const LARGO_QUE = 500
const LARGO_DONDE = 200
const LARGO_CONTACTO = 120

const texto = (v) => String(v ?? '').replace(/\s+/g, ' ').trim()

function ajustes(horarios) {
  return horarios && typeof horarios === 'object' && !Array.isArray(horarios)
    ? horarios._settings ?? {}
    : {}
}

/** Si el local es el que toma los mandados de su ciudad. */
export function esLocalDeMandados(horarios) {
  return ajustes(horarios).captaMandados === true
}

/** Hasta cuanto puede pedir el cliente que le adelanten en una compra. */
export function topeDeCompra(horarios) {
  const tope = Number(ajustes(horarios).mandadoTopeCompra)
  return Number.isFinite(tope) && tope > 0 ? Math.round(tope) : TOPE_COMPRA_POR_DEFECTO
}

function pesos(valor) {
  return `$${Math.round(Number(valor) || 0).toLocaleString('es-AR')}`
}

/**
 * Lo que mando el cliente, limpio y validado.
 *
 * Devuelve { ok: true, mandado } o { ok: false, mensaje } con un mensaje para
 * mostrarle al cliente tal cual.
 */
export function normalizarMandado(entrada, { tope = TOPE_COMPRA_POR_DEFECTO } = {}) {
  if (!entrada || typeof entrada !== 'object') {
    return { ok: false, mensaje: 'Contanos qué necesitás que hagamos.' }
  }

  const tipo = TIPOS_MANDADO.some((t) => t.id === entrada.tipo) ? entrada.tipo : null
  if (!tipo) return { ok: false, mensaje: 'Elegí si hay que comprar algo o llevar un paquete.' }

  const que = texto(entrada.que).slice(0, LARGO_QUE)
  if (que.length < 3) {
    return {
      ok: false,
      mensaje: tipo === 'compra' ? 'Contanos qué hay que comprar.' : 'Contanos qué hay que llevar.',
    }
  }

  const donde = texto(entrada.donde).slice(0, LARGO_DONDE)

  if (tipo === 'compra') {
    const monto = Math.round(Number(entrada.tope))
    if (!Number.isFinite(monto) || monto <= 0) {
      return { ok: false, mensaje: 'Poné cuánto puede salir, más o menos: es lo que adelanta el repartidor.' }
    }
    if (monto > tope) {
      return { ok: false, mensaje: `Por ahora los mandados con compra son de hasta ${pesos(tope)}.` }
    }
    return { ok: true, mandado: { tipo, que, donde, tope: monto } }
  }

  // Un paquete sin direccion de retiro no se puede ir a buscar.
  if (donde.length < 3) return { ok: false, mensaje: 'Poné la dirección donde hay que retirarlo.' }

  return {
    ok: true,
    mandado: {
      tipo,
      que,
      donde,
      contacto: texto(entrada.contacto).slice(0, LARGO_CONTACTO),
      pagaEn: entrada.pagaEn === 'retiro' ? 'retiro' : 'entrega',
    },
  }
}

/** El renglon del pedido: lo que se ve en Pedidos, en el despacho y en la app. */
export function nombreDelItem(mandado) {
  return mandado?.tipo === 'compra' ? `Mandado: comprar ${mandado.que}` : `Mandado: llevar ${mandado?.que ?? ''}`.trim()
}

/**
 * Las notas del pedido. Viajan al envio (envios_capta.notas) y son lo que lee
 * el repartidor en su app aunque la pantalla no sepa nada de mandados.
 */
export function notasDelMandado(mandado) {
  if (!mandado) return ''
  if (mandado.tipo === 'compra') {
    return [
      'MANDADO - COMPRA',
      `Comprar: ${mandado.que}`,
      `Dónde: ${mandado.donde || 'donde convenga'}`,
      `Adelantás hasta ${pesos(mandado.tope)}. Al entregar cobrás el ticket de la compra + el envío.`,
    ].join('\n')
  }
  return [
    'MANDADO - PAQUETE',
    `Retirar en: ${mandado.donde}${mandado.contacto ? ` (${mandado.contacto})` : ''}`,
    `Qué es: ${mandado.que}`,
    `El envío se cobra al ${mandado.pagaEn === 'retiro' ? 'retirar' : 'entregar'}.`,
  ].join('\n')
}

/** Lo que se le dice al cliente en la confirmacion: como y cuando paga. */
export function avisoAlCliente(mandado) {
  if (!mandado) return ''
  if (mandado.tipo === 'compra') {
    return `Mandado: ${mandado.que}. Pagás al recibir, en efectivo: lo que salga la compra (hasta ${pesos(mandado.tope)}) + el envío.`
  }
  return `Mandado: ${mandado.que}, desde ${mandado.donde}. El envío se paga en efectivo al ${mandado.pagaEn === 'retiro' ? 'retirar' : 'entregar'}.`
}

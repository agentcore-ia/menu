// Los mandados de Capta Delivery: el cliente pide algo que no esta en ningun
// menu ("comprame un cargador en el kiosco", "llevale estas llaves a mi vieja")
// y un repartidor de Capta lo hace. Como los "Favores" de Rappi.
//
// Los mandados son de CAPTA, no de un local: los valida, cobra y despacha el
// dashboard (lib/mandadoCapta.ts y lib/server/mandadosCapta.ts). Esta copia de
// la validacion es solo para que el formulario de la vitrina avise antes de
// mandar; la que manda es la del dashboard. Si se cambia una regla, va en los
// dos lados.
//
//   node --test shared/mandados.test.mjs

export const TIPOS_MANDADO = [
  { id: 'compra', label: 'Comprar algo', detalle: 'Te lo compramos y te lo llevamos' },
  { id: 'paquete', label: 'Llevar un paquete', detalle: 'Lo retiramos y lo entregamos' },
]

/** Lo maximo que adelanta un repartidor si la ciudad no dice otra cosa. */
export const TOPE_COMPRA_POR_DEFECTO = 30000

const LARGO_QUE = 500
const LARGO_DONDE = 200
const LARGO_CONTACTO = 120

const texto = (v) => String(v ?? '').replace(/\s+/g, ' ').trim()

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

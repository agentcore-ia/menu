// Un pedido deja de mostrarse como "en curso" en capta.ar a los dos dias, aunque el local nunca
// lo haya marcado como entregado (pasa seguido): para entonces ya se entrego o no se va a entregar.
//
// Se cuenta desde la fecha del pedido. Un pedido programado lleva la fecha del dia para el que se
// pidio, asi que no vence antes de tiempo.

export const HORAS_EN_CURSO = 48

export function pedidoVencido(fecha, ahora = Date.now()) {
  const momento = Date.parse(fecha)
  // Sin fecha legible no se puede decir que sea viejo.
  return Number.isFinite(momento) && ahora - momento > HORAS_EN_CURSO * 60 * 60 * 1000
}

/** Los pedidos de la cuenta, dando por terminados los que ya vencieron. */
export function cerrarPedidosVencidos(pedidos, ahora = Date.now()) {
  return (Array.isArray(pedidos) ? pedidos : []).map((p) =>
    !p.terminado && pedidoVencido(p.fecha, ahora) ? { ...p, terminado: true, estado: 'Finalizado' } : p,
  )
}

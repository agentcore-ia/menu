import { almacenDelNavegador } from '../shared/datosDelCliente.js'

const CLAVE = 'capta-pedidos-seguimiento'
const VIGENCIA = 14 * 24 * 60 * 60 * 1000
const CLAVE_PAGO = 'capta:seguimiento-pago'
const TOKEN_PEDIDO = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i

function leerSeguimientosDePago(almacen) {
  const lista = JSON.parse(almacen?.getItem(CLAVE_PAGO) || '[]')
  return Array.isArray(lista) ? lista.filter((p) => Date.now() - p?.at < VIGENCIA) : []
}

// Mercado Pago puede volver en otra pestaña, sin la sessionStorage del carrito.
export function guardarSeguimientoDePago(id, token) {
  if (!id || !TOKEN_PEDIDO.test(token)) return
  try {
    const almacen = almacenDelNavegador()
    const otros = leerSeguimientosDePago(almacen).filter((p) => p.id !== id)
    almacen?.setItem(CLAVE_PAGO, JSON.stringify([{ id, token, at: Date.now() }, ...otros].slice(0, 5)))
  } catch {
    // Si no hay almacenamiento, queda el pedido guardado en la pestaña original.
  }
}

export function abrirSeguimientoDelPedido({ id, trackingToken } = {}) {
  let token = trackingToken
  try {
    const almacen = almacenDelNavegador()
    const pagos = leerSeguimientosDePago(almacen)
    const pago = pagos.find((p) => p.id === id)
    if (pago) {
      if (!TOKEN_PEDIDO.test(token)) token = pago.token
      almacen?.setItem(CLAVE_PAGO, JSON.stringify(pagos.filter((p) => p.id !== id)))
    }
  } catch {
    // Todavía se puede usar el enlace que devolvió el pedido.
  }
  window.location.replace(TOKEN_PEDIDO.test(token)
    ? `https://seguimiento.capta.ar/seguimiento/${token}`
    : 'https://capta.ar/pedi?vista=pedidos')
}

function leerPedidosGuardados() {
  try {
    const lista = JSON.parse(almacenDelNavegador()?.getItem(CLAVE) || '[]')
    return Array.isArray(lista)
      ? lista.filter((p) => p?.token && Date.now() - p.at < VIGENCIA)
      : []
  } catch {
    return []
  }
}

function escribirPedidosGuardados(lista) {
  try {
    almacenDelNavegador()?.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    // El seguimiento que llega por WhatsApp sigue disponible.
  }
}

export function guardarSeguimientoPedido(token) {
  if (!token) return
  const anteriores = leerPedidosGuardados().filter((p) => p.token !== token)
  escribirPedidosGuardados([{ token, at: Date.now() }, ...anteriores].slice(0, 5))
}

export async function consultarPedidoGuardado() {
  for (const { token } of leerPedidosGuardados()) {
    const respuesta = await fetch(`/api/delivery/pedido-activo?token=${encodeURIComponent(token)}`, {
      cache: 'no-store',
    })
    if (respuesta.status !== 404 && !respuesta.ok) throw new Error('No se pudo consultar el pedido')
    const pedido = respuesta.ok ? await respuesta.json() : null
    if (pedido && !pedido.terminado) return pedido

    escribirPedidosGuardados(leerPedidosGuardados().filter((p) => p.token !== token))
  }
  return null
}

export function actualizarPedidos(consultar, { repetir = true } = {}) {
  let consultando = false
  const actualizar = async () => {
    if (consultando || document.hidden) return
    consultando = true
    try {
      await consultar()
    } finally {
      consultando = false
    }
  }

  void actualizar()
  const intervalo = repetir ? window.setInterval(actualizar, 30000) : null
  document.addEventListener('visibilitychange', actualizar)
  window.addEventListener('pageshow', actualizar)
  return () => {
    window.clearInterval(intervalo)
    document.removeEventListener('visibilitychange', actualizar)
    window.removeEventListener('pageshow', actualizar)
  }
}

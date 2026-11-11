import { almacenDelNavegador } from '../shared/datosDelCliente.js'

const CLAVE = 'capta-pedidos-seguimiento'
const VIGENCIA = 14 * 24 * 60 * 60 * 1000

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

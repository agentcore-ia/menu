import { getServerConfig } from './config.js'

const ESTADOS = {
  new: 'Pedido recibido',
  preparing: 'En preparación',
  ready: 'Listo',
  delivering: 'En camino',
  pendiente_pago: 'Esperando el pago',
  por_aceptar: 'Por confirmar',
}

export async function pedidoActivo(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({})
  }

  const token = req.query?.token
  if (typeof token !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(token)) {
    return res.status(400).json({})
  }

  const base = getServerConfig().dashboardUrl.replace(/\/+$/, '')
  try {
    const respuesta = await fetch(`${base}/api/public/order-tracking?token=${token}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (respuesta.status === 404) return res.status(404).json({})
    if (!respuesta.ok) return res.status(502).json({})

    const { order } = await respuesta.json()
    if (!order) return res.status(502).json({})
    if (['delivered', 'completed', 'cancelled', 'pago_vencido'].includes(order.status)) {
      return res.json({ terminado: true })
    }
    return res.json({
      numero: order.order_number,
      local: order.restaurants?.name || '',
      estado: ESTADOS[order.status] || 'Estado sin confirmar',
      seguimiento: `https://seguimiento.capta.ar/seguimiento/${token}`,
    })
  } catch {
    return res.status(502).json({})
  }
}

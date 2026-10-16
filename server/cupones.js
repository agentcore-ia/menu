// Los cupones de Capta Delivery (/api/delivery/cupones). Los crea el admin en el
// dashboard; aca se leen las ofertas a la vista (y las de la cuenta, con
// sesion) y se prueba un codigo contra un pedido antes de pedir. El descuento
// real lo vuelve a validar el servidor al crear el pedido.
//
//   GET  (Authorization: Bearer <token> opcional) -> { ofertas, billetera }
//   POST { codigo, slug, comida, envio, telefono, sesionCapta, desdeVitrina }
//        -> { ok: true, codigo, titulo, tipo, pesos } | { ok: false, motivo }
//
// Una sola ruta para los dos: en Vercel entra por orders.js con un rewrite (el
// plan tiene un tope de funciones) y en el servidor local por index.js.
import { getServerConfig } from './config.js'
import { createOrderRepository } from './repositories/orderRepository.js'

export async function cupones(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  const orderRepository = createOrderRepository(getServerConfig())

  if (req.method === 'GET') {
    try {
      const auth = String(req.headers?.authorization || '')
      const token = /^Bearer\s+[a-f0-9]{64}$/i.test(auth) ? auth.replace(/^Bearer\s+/i, '') : ''
      res.status(200).json(await orderRepository.cuponesParaLaApp({ sesionCapta: token }))
    } catch (error) {
      res.status(500).json({
        message: 'No se pudieron cargar los cupones.',
        detail: error instanceof Error ? error.message : '',
      })
    }
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ message: 'Método no permitido.' })
    return
  }

  try {
    const b = req.body ?? {}
    const restaurant = await orderRepository.fetchRestaurant?.(String(b.slug || ''))
    if (!restaurant) {
      res.status(404).json({ ok: false, motivo: 'No encontramos el local.' })
      return
    }
    const r = await orderRepository.evaluarCuponDeCapta({
      codigo: b.codigo,
      restaurant,
      comida: Number(b.comida) || 0,
      envio: Number(b.envio) || 0,
      telefono: b.telefono,
      sesionCapta: b.sesionCapta,
      desdeVitrina: b.desdeVitrina === true,
    })
    res
      .status(200)
      .json(
        r.ok
          ? { ok: true, codigo: r.cupon.codigo, titulo: r.cupon.titulo, tipo: r.cupon.tipo, pesos: r.pesos }
          : { ok: false, motivo: r.motivo },
      )
  } catch {
    res.status(500).json({ ok: false, motivo: 'No pudimos revisar el cupón. Probá de nuevo.' })
  }
}

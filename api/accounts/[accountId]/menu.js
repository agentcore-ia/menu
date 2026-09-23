import { getServerConfig } from '../../../server/config.js'
import { createMenuRepository } from '../../../server/repositories/menuRepository.js'
import { createOrderRepository } from '../../../server/repositories/orderRepository.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Solo se permite GET.',
    })
    return
  }

  const config = getServerConfig()
  const repository = createMenuRepository(config)

  // Los puntos de Capta Delivery de un cliente (por su celular). Entra por
  // aca por lo mismo que la vitrina: el tope de funciones de Vercel.
  if (req.query.accion === 'puntos') {
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    try {
      const orderRepository = createOrderRepository(config)
      const cuenta = await orderRepository.puntosDeCapta?.(req.query.telefono)
      if (!cuenta) {
        res.status(200).json({ puntos: 0, pesos: 0, config: null, movimientos: [] })
        return
      }
      const datos = await orderRepository.resumenDePuntos?.(cuenta)
      res.status(200).json(datos ?? { puntos: cuenta.puntos, pesos: 0, config: cuenta.config, movimientos: [] })
    } catch (error) {
      res.status(500).json({
        error: 'PUNTOS_LOAD_FAILED',
        message: 'No se pudieron cargar los puntos.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    return
  }

  // La vitrina de Capta Delivery (/api/delivery/locales) entra por ESTA misma
  // funcion: vercel.json la reescribe hasta aca con accion=vitrina. No tiene
  // que ver con la cuenta de la direccion, que se ignora.
  //
  // Por que asi y no un archivo propio en api/: el plan de Vercel tiene un tope
  // de funciones y ya estaba justo. Es el mismo truco que ya se usa con
  // pay-card y con pago, que entran por orders.js. En el servidor local (
  // server/index.js) si es una ruta aparte.
  if (req.query.accion === 'vitrina') {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')

    try {
      res.status(200).json(await repository.listarVitrinaCapta())
    } catch (error) {
      res.status(500).json({
        error: 'VITRINA_LOAD_FAILED',
        message: 'No se pudo cargar la lista de locales.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    return
  }

  try {
    const menu = await repository.getMenuByAccountId(req.query.accountId)

    if (!menu) {
      res.status(404).json({
        error: 'MENU_NOT_FOUND',
        message: 'No se encontro un menu para esa cuenta.',
      })
      return
    }

    res.status(200).json(menu)
  } catch (error) {
    res.status(500).json({
      error: 'MENU_LOAD_FAILED',
      message: 'No se pudo cargar el menu.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

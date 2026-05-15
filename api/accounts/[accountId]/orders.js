import { getServerConfig } from '../../../server/config.js'
import { createOrderRepository } from '../../../server/repositories/orderRepository.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Solo se permite POST.',
    })
    return
  }

  try {
    const payload = req.body ?? {}

    if (!payload.customer?.phone || !payload.customer?.name) {
      res.status(400).json({
        error: 'CUSTOMER_REQUIRED',
        message: 'Nombre y celular son obligatorios para enviar el pedido.',
      })
      return
    }

    const hasProducts = Array.isArray(payload.items) && payload.items.length > 0
    const hasRedemptions = Array.isArray(payload.redemptions) && payload.redemptions.length > 0

    if (!hasProducts && !hasRedemptions) {
      res.status(400).json({
        error: 'ITEMS_REQUIRED',
        message: 'Agrega al menos un producto o canje al pedido.',
      })
      return
    }

    const config = getServerConfig()
    const repository = createOrderRepository(config)
    const order = await repository.createOrder(req.query.accountId, payload)

    if (!order) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: 'No se encontro la cuenta para crear el pedido.',
      })
      return
    }

    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({
      error: 'ORDER_CREATE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo crear el pedido.',
    })
  }
}

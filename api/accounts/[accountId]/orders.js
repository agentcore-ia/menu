import { getServerConfig } from '../../../server/config.js'
import { pagarConTarjeta } from '../../../server/pagarConTarjeta.js'
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

  // Vercel cuenta una funcion por archivo y el plan permite doce: ya estaban
  // todas usadas. El pago con tarjeta entra por aca con un rewrite en vez de
  // sumar un archivo, que es lo que hizo fallar el deploy sin avisar.
  if (req.query?.accion === 'pagar-con-tarjeta') {
    await pagarConTarjeta(req, res)
    return
  }

  try {
    const payload = req.body ?? {}

    if (!payload.customer?.name || !isValidCustomerPhone(payload.customer?.phone)) {
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

    if (hasProducts && !payload.items.every(isValidOrderItem)) {
      res.status(400).json({
        error: 'INVALID_ITEMS',
        message: 'Revisa los productos del pedido antes de enviarlo.',
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
    if (error?.code === 'DELIVERY_OUT_OF_AREA') {
      res.status(error.statusCode ?? 422).json({
        error: 'DELIVERY_OUT_OF_AREA',
        message: error.message,
        deliveryQuote: error.deliveryQuote ?? null,
      })
      return
    }

    if (error?.code === 'RESTAURANT_CLOSED') {
      res.status(error.statusCode ?? 409).json({
        error: 'RESTAURANT_CLOSED',
        message: error.message,
        ordering: error.ordering ?? null,
      })
      return
    }

    if (error?.code === 'ORDER_TAKING_PAUSED' || error?.ordering?.paused === true) {
      res.status(error.statusCode ?? 409).json({
        error: 'ORDER_TAKING_PAUSED',
        message: error.message,
        ordering: error.ordering ?? null,
      })
      return
    }

    res.status(500).json({
      error: 'ORDER_CREATE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo crear el pedido.',
    })
  }
}

function isValidCustomerPhone(value) {
  return String(value ?? '').replace(/\D/g, '').length >= 8
}

function isValidOrderItem(item) {
  if (!item || typeof item !== 'object') return false

  const quantity = Number(item.quantity)
  const unitPrice = Number(item.unitPrice)

  return (
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0
  )
}

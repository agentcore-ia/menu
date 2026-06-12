import { resolveDeliveryQuote } from '../../../server/deliveryZones.js'
import { getServerConfig } from '../../../server/config.js'
import { createMenuRepository } from '../../../server/repositories/menuRepository.js'

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

  try {
    const menu = await repository.getMenuByAccountId(req.query.accountId)

    if (!menu) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: 'No se encontro la cuenta para calcular el envio.',
      })
      return
    }

    const quote = await resolveDeliveryQuote({
      horarios: menu.businessHours,
      fallbackFee: menu.deliveryFee,
      address: req.query.address,
      neighborhood: req.query.neighborhood,
      city: req.query.city || menu.city,
    })

    res.status(200).json(quote)
  } catch (error) {
    res.status(500).json({
      error: 'DELIVERY_ZONE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo calcular la zona de entrega.',
    })
  }
}

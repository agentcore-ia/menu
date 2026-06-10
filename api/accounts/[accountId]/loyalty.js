import { getServerConfig } from '../../../server/config.js'
import { createLoyaltyRepository } from '../../../server/repositories/loyaltyRepository.js'

export default async function handler(req, res) {
  const config = getServerConfig()
  const repository = createLoyaltyRepository(config)

  try {
    if (req.method === 'POST') {
      const member = await repository.joinCommunityByAccountId(req.query.accountId, req.body ?? {})

      if (!member) {
        res.status(404).json({
          error: 'ACCOUNT_NOT_FOUND',
          message: 'No se encontro la cuenta para sumarte a la comunidad.',
        })
        return
      }

      res.status(200).json(member)
      return
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST')
      res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido.' })
      return
    }

    const loyalty = await repository.getLoyaltyByAccountId(req.query.accountId, req.query.phone)

    if (!loyalty) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: 'No se encontro la cuenta para consultar puntos.',
      })
      return
    }

    res.status(200).json(loyalty)
  } catch (error) {
    res.status(500).json({
      error: 'LOYALTY_LOAD_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo consultar el programa de puntos.',
    })
  }
}

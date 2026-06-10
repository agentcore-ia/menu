import { getServerConfig } from '../../../server/config.js'
import { createLoyaltyRepository } from '../../../server/repositories/loyaltyRepository.js'

export default async function handler(req, res) {
  const config = getServerConfig()
  const repository = createLoyaltyRepository(config)

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido.' })
      return
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0')

    const community = await repository.getLoyaltyCommunityByAccountId(req.query.accountId)

    if (!community) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: 'No se encontro la cuenta para consultar la comunidad.',
      })
      return
    }

    res.status(200).json(community)
  } catch (error) {
    res.status(500).json({
      error: 'COMMUNITY_LOAD_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo consultar la comunidad.',
    })
  }
}

import { getServerConfig } from '../../../server/config.js'
import { createAdminRepository } from '../../../server/admin/createAdminRepository.js'
import { assertAdminToken } from '../../../server/admin/requireAdminToken.js'

export default async function handler(req, res) {
  const config = getServerConfig()
  const repository = createAdminRepository(config)

  try {
    assertAdminToken(config, req)

    if (req.method === 'GET') {
      const accounts = await repository.listAccounts()
      res.status(200).json(accounts)
      return
    }

    if (req.method === 'POST') {
      const restaurant = await repository.createAccount(req.body)
      res.status(201).json(restaurant)
      return
    }

    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido.' })
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'ADMIN_ACCOUNTS_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo completar la accion.',
    })
  }
}

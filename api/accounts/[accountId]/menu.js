import { getServerConfig } from '../../../server/config.js'
import { createMenuRepository } from '../../../server/repositories/menuRepository.js'

export default async function handler(req, res) {
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

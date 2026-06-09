import { getServerConfig } from '../../../server/config.js'
import { createMenuRepository } from '../../../server/repositories/menuRepository.js'
import { createMenuManifest } from '../../../server/pwaManifest.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')

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

    res.status(200).json(createMenuManifest(menu, req))
  } catch (error) {
    res.status(500).json({
      error: 'MANIFEST_LOAD_FAILED',
      message: 'No se pudo cargar la app instalable.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

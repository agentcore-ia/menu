import { getServerConfig } from '../../../../server/config.js'
import { createAdminRepository } from '../../../../server/admin/createAdminRepository.js'
import { assertAdminToken } from '../../../../server/admin/requireAdminToken.js'

export default async function handler(req, res) {
  const config = getServerConfig()
  const repository = createAdminRepository(config)

  try {
    assertAdminToken(config, req)

    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'PATCH')
      res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido.' })
      return
    }

    const presentation = await repository.savePresentation(req.query.accountId, req.body)

    if (!presentation) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada.' })
      return
    }

    res.status(200).json(presentation)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'PRESENTATION_SAVE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo guardar la presentacion.',
    })
  }
}

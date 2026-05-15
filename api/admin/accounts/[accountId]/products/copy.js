import { getServerConfig } from '../../../../../server/config.js'
import { createAdminRepository } from '../../../../../server/admin/createAdminRepository.js'
import { assertAdminToken } from '../../../../../server/admin/requireAdminToken.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido.' })
    return
  }

  const config = getServerConfig()
  const repository = createAdminRepository(config)

  try {
    assertAdminToken(config, req)
    const result = await repository.copyProductsFromAccount(
      req.query.accountId,
      req.body?.sourceAccountId,
      {
        replaceExisting: Boolean(req.body?.replaceExisting),
      },
    )

    if (!result) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta destino no encontrada.' })
      return
    }

    res.status(200).json(result)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'PRODUCT_COPY_FAILED',
      message: error instanceof Error ? error.message : 'No se pudieron copiar los productos.',
    })
  }
}

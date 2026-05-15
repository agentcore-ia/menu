import { getServerConfig } from '../../../../server/config.js'
import { createAdminRepository } from '../../../../server/admin/createAdminRepository.js'
import { assertAdminToken } from '../../../../server/admin/requireAdminToken.js'

function getActionPath(req) {
  const action = req.query.action
  return Array.isArray(action) ? action.join('/') : String(action ?? '')
}

function methodNotAllowed(res, allow) {
  res.setHeader('Allow', allow)
  res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido.' })
}

export default async function handler(req, res) {
  const config = getServerConfig()
  const repository = createAdminRepository(config)
  const actionPath = getActionPath(req)

  try {
    assertAdminToken(config, req)

    if (actionPath === 'editor') {
      if (req.method !== 'GET') {
        methodNotAllowed(res, 'GET')
        return
      }

      const data = await repository.getAccountEditorData(req.query.accountId)

      if (!data) {
        res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada.' })
        return
      }

      res.status(200).json(data)
      return
    }

    if (actionPath === 'presentation') {
      if (req.method !== 'PATCH') {
        methodNotAllowed(res, 'PATCH')
        return
      }

      const presentation = await repository.savePresentation(req.query.accountId, req.body)

      if (!presentation) {
        res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada.' })
        return
      }

      res.status(200).json(presentation)
      return
    }

    if (actionPath === 'asset-upload-url') {
      if (req.method !== 'POST') {
        methodNotAllowed(res, 'POST')
        return
      }

      const upload = await repository.createMenuAssetUpload(req.query.accountId, {
        fileName: req.body?.fileName,
        contentType: req.body?.contentType,
        size: req.body?.size,
        kind: req.body?.kind,
      })

      if (!upload) {
        res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada.' })
        return
      }

      res.status(200).json(upload)
      return
    }

    if (actionPath === 'products/copy') {
      if (req.method !== 'POST') {
        methodNotAllowed(res, 'POST')
        return
      }

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
      return
    }

    res.status(404).json({ error: 'ADMIN_ROUTE_NOT_FOUND', message: 'Ruta admin no encontrada.' })
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'ADMIN_ACCOUNT_ACTION_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo completar la accion.',
    })
  }
}

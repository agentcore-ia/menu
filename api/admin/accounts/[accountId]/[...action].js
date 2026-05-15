import { getServerConfig } from '../../../../server/config.js'
import { createAdminRepository } from '../../../../server/admin/createAdminRepository.js'
import { assertAdminToken } from '../../../../server/admin/requireAdminToken.js'

function getActionPath(req) {
  const action = req.query?.action ?? req.query?.['...action']

  if (Array.isArray(action)) {
    return action.join('/')
  }

  if (action) {
    return String(action)
  }

  const segments = getRequestPathSegments(req)
  const accountsIndex = segments.findIndex(
    (segment, index) => segment === 'accounts' && segments[index - 1] === 'admin',
  )

  if (accountsIndex === -1) {
    return ''
  }

  return segments.slice(accountsIndex + 2).join('/')
}

function getAccountId(req) {
  const accountId = req.query?.accountId

  if (Array.isArray(accountId)) {
    return accountId[0]
  }

  if (accountId) {
    return String(accountId)
  }

  const segments = getRequestPathSegments(req)
  const accountsIndex = segments.findIndex(
    (segment, index) => segment === 'accounts' && segments[index - 1] === 'admin',
  )

  return accountsIndex === -1 ? '' : segments[accountsIndex + 1] ?? ''
}

function getRequestPathSegments(req) {
  const pathname = new URL(req.url ?? '', 'https://menu.local').pathname
  return pathname.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment))
}

function methodNotAllowed(res, allow) {
  res.setHeader('Allow', allow)
  res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido.' })
}

export default async function handler(req, res) {
  const config = getServerConfig()
  const repository = createAdminRepository(config)
  const actionPath = getActionPath(req)
  const accountId = getAccountId(req)

  try {
    assertAdminToken(config, req)

    if (actionPath === 'editor') {
      if (req.method !== 'GET') {
        methodNotAllowed(res, 'GET')
        return
      }

      const data = await repository.getAccountEditorData(accountId)

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

      const presentation = await repository.savePresentation(accountId, req.body)

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

      const upload = await repository.createMenuAssetUpload(accountId, {
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
        accountId,
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

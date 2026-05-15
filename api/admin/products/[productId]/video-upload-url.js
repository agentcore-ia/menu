import { getServerConfig } from '../../../../server/config.js'
import { createAdminRepository } from '../../../../server/admin/createAdminRepository.js'
import { assertAdminToken } from '../../../../server/admin/requireAdminToken.js'

export default async function handler(req, res) {
  const config = getServerConfig()
  const repository = createAdminRepository(config)

  try {
    assertAdminToken(config, req)

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Metodo no permitido.' })
      return
    }

    const upload = await repository.createProductVideoUpload(req.query.productId, {
      fileName: req.body?.fileName,
      contentType: req.body?.contentType,
      size: req.body?.size,
    })

    if (!upload) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' })
      return
    }

    res.status(200).json(upload)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'PRODUCT_VIDEO_UPLOAD_URL_FAILED',
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo preparar la subida directa del video.',
    })
  }
}

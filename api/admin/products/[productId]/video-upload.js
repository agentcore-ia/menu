import { getServerConfig } from '../../../../server/config.js'
import { createAdminRepository } from '../../../../server/admin/createAdminRepository.js'
import { assertAdminToken } from '../../../../server/admin/requireAdminToken.js'

async function readRequestBuffer(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  return Buffer.concat(chunks)
}

export const config = {
  api: {
    bodyParser: false,
  },
}

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

    const buffer = await readRequestBuffer(req)

    if (!buffer.length) {
      res.status(400).json({ error: 'VIDEO_REQUIRED', message: 'Selecciona un video para subir.' })
      return
    }

    const product = await repository.uploadProductVideo(req.query.productId, {
      buffer,
      fileName: req.headers['x-file-name'],
      contentType: req.headers['content-type'],
    })

    if (!product) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' })
      return
    }

    res.status(200).json(product)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'PRODUCT_VIDEO_UPLOAD_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo subir el video.',
    })
  }
}

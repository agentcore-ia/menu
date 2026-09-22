import { getServerConfig } from '../../server/config.js'
import { createMenuRepository } from '../../server/repositories/menuRepository.js'

/**
 * Los locales que reparten con Capta Delivery, para la vitrina (/pedi).
 *
 * Es publica y sin datos de nadie: la misma lista para todo el mundo. Por eso
 * se puede cachear un minuto en el borde de Vercel; asi abrir la pantalla no
 * golpea la base cada vez.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Solo se permite GET.' })
    return
  }

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')

  try {
    const repository = createMenuRepository(getServerConfig())
    const vitrina = await repository.listarVitrinaCapta()
    res.status(200).json(vitrina)
  } catch (error) {
    res.status(500).json({
      error: 'VITRINA_LOAD_FAILED',
      message: 'No se pudo cargar la lista de locales.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

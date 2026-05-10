import express from 'express'
import { getServerConfig } from './config.js'
import { createMenuRepository } from './repositories/menuRepository.js'

const config = getServerConfig()
const repository = createMenuRepository(config)
const app = express()

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: config.dataProvider,
  })
})

app.get('/api/accounts/:accountId/menu', async (req, res) => {
  try {
    const menu = await repository.getMenuByAccountId(req.params.accountId)

    if (!menu) {
      res.status(404).json({
        error: 'MENU_NOT_FOUND',
        message: 'No se encontro un menu para esa cuenta.',
      })
      return
    }

    res.json(menu)
  } catch (error) {
    res.status(500).json({
      error: 'MENU_LOAD_FAILED',
      message:
        'No se pudo cargar el menu. Revisa la configuracion de la base de datos de NeuroRest.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.listen(config.port, () => {
  console.log(`NeuroRest menu API listening on http://127.0.0.1:${config.port}`)
})

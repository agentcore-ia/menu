import 'dotenv/config'
import express from 'express'
import { getServerConfig } from './config.js'
import { createMenuRepository } from './repositories/menuRepository.js'
import { createAdminRepository } from './admin/createAdminRepository.js'
import { assertAdminToken } from './admin/requireAdminToken.js'

const config = getServerConfig()
const repository = createMenuRepository(config)
const adminRepository = createAdminRepository(config)
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

app.get('/api/admin/accounts', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const accounts = await adminRepository.listAccounts()
    res.json(accounts)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'ADMIN_LOAD_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo cargar el admin.',
    })
  }
})

app.post('/api/admin/accounts', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const restaurant = await adminRepository.createAccount(req.body)
    res.status(201).json(restaurant)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'ACCOUNT_CREATE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
    })
  }
})

app.get('/api/admin/accounts/:accountId/editor', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const data = await adminRepository.getAccountEditorData(req.params.accountId)

    if (!data) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada.' })
      return
    }

    res.json(data)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'EDITOR_LOAD_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo cargar el editor.',
    })
  }
})

app.patch('/api/admin/accounts/:accountId/presentation', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const presentation = await adminRepository.savePresentation(req.params.accountId, req.body)

    if (!presentation) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada.' })
      return
    }

    res.json(presentation)
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
})

app.patch('/api/admin/products/:productId/media', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const product = await adminRepository.updateProductMedia(req.params.productId, req.body)
    res.json(product)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'PRODUCT_MEDIA_SAVE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo guardar el media del producto.',
    })
  }
})

app.listen(config.port, () => {
  console.log(`NeuroRest menu API listening on http://127.0.0.1:${config.port}`)
})

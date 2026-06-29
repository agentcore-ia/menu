import 'dotenv/config'
import express from 'express'
import { getServerConfig } from './config.js'
import { createMenuRepository } from './repositories/menuRepository.js'
import { createOrderRepository } from './repositories/orderRepository.js'
import { createLoyaltyRepository } from './repositories/loyaltyRepository.js'
import { createAdminRepository } from './admin/createAdminRepository.js'
import { assertAdminToken } from './admin/requireAdminToken.js'
import { createMenuManifest } from './pwaManifest.js'
import { resolveDeliveryQuote } from './deliveryZones.js'

const config = getServerConfig()
const repository = createMenuRepository(config)
const orderRepository = createOrderRepository(config)
const loyaltyRepository = createLoyaltyRepository(config)
const adminRepository = createAdminRepository(config)
const app = express()

app.post('/api/admin/products/:productId/video-upload', express.raw({ type: 'video/*', limit: '50mb' }), async (req, res) => {
  try {
    assertAdminToken(config, req)
    const fileName = req.headers['x-file-name']
    const contentType = req.headers['content-type']

    if (!req.body || !req.body.length) {
      res.status(400).json({ error: 'VIDEO_REQUIRED', message: 'Selecciona un video para subir.' })
      return
    }

    const product = await adminRepository.uploadProductVideo(req.params.productId, {
      buffer: req.body,
      fileName: Array.isArray(fileName) ? fileName[0] : fileName,
      contentType: Array.isArray(contentType) ? contentType[0] : contentType,
    })

    if (!product) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' })
      return
    }

    res.json(product)
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
})

app.post('/api/admin/products/:productId/image-upload', express.raw({ type: 'image/*', limit: '20mb' }), async (req, res) => {
  try {
    assertAdminToken(config, req)
    const fileName = req.headers['x-file-name']
    const contentType = req.headers['content-type']

    if (!req.body || !req.body.length) {
      res.status(400).json({ error: 'IMAGE_REQUIRED', message: 'Selecciona una imagen para subir.' })
      return
    }

    const product = await adminRepository.uploadProductImage(req.params.productId, {
      buffer: req.body,
      fileName: Array.isArray(fileName) ? fileName[0] : fileName,
      contentType: Array.isArray(contentType) ? contentType[0] : contentType,
    })

    if (!product) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' })
      return
    }

    res.json(product)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'PRODUCT_IMAGE_UPLOAD_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo subir la imagen.',
    })
  }
})

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: config.dataProvider,
  })
})

app.get('/api/accounts/:accountId/menu', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

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
        'No se pudo cargar el menu. Revisa la configuracion de la base de datos de capta.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/accounts/:accountId/manifest.webmanifest', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')

  try {
    const menu = await repository.getMenuByAccountId(req.params.accountId)

    if (!menu) {
      res.status(404).json({
        error: 'MENU_NOT_FOUND',
        message: 'No se encontro un menu para esa cuenta.',
      })
      return
    }

    res.json(createMenuManifest(menu, req))
  } catch (error) {
    res.status(500).json({
      error: 'MANIFEST_LOAD_FAILED',
      message: 'No se pudo cargar la app instalable.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/accounts/:accountId/delivery-zone', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  try {
    const menu = await repository.getMenuByAccountId(req.params.accountId)

    if (!menu) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: 'No se encontro la cuenta para calcular el envio.',
      })
      return
    }

    const quote = await resolveDeliveryQuote({
      horarios: menu.businessHours,
      fallbackFee: menu.deliveryFee,
      address: req.query.address,
      neighborhood: req.query.neighborhood,
      city: req.query.city || menu.city,
      province: req.query.province || menu.province,
      originCoordinates: menu.localLocation,
      confirmed: req.query.confirmed === 'true',
      coordinates:
        req.query.lat && req.query.lng
          ? {
              lat: req.query.lat,
              lng: req.query.lng,
              label: req.query.label,
            }
          : null,
    })

    res.json(quote)
  } catch (error) {
    res.status(500).json({
      error: 'DELIVERY_ZONE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo calcular la zona de entrega.',
    })
  }
})

app.post('/api/accounts/:accountId/orders', async (req, res) => {
  try {
    const payload = req.body ?? {}

    if (!payload.customer?.name) {
      res.status(400).json({
        error: 'CUSTOMER_REQUIRED',
        message: 'El nombre es obligatorio para enviar el pedido.',
      })
      return
    }

    if (!isValidCustomerPhone(payload.customer?.phone)) {
      res.status(400).json({
        error: 'CUSTOMER_PHONE_REQUIRED',
        message: 'Nombre y celular son obligatorios para enviar el pedido.',
      })
      return
    }

    const hasProducts = Array.isArray(payload.items) && payload.items.length > 0
    const hasRedemptions = Array.isArray(payload.redemptions) && payload.redemptions.length > 0

    if (!hasProducts && !hasRedemptions) {
      res.status(400).json({
        error: 'ITEMS_REQUIRED',
        message: 'Agrega al menos un producto o canje al pedido.',
      })
      return
    }

    if (hasProducts && !payload.items.every(isValidOrderItem)) {
      res.status(400).json({
        error: 'INVALID_ITEMS',
        message: 'Revisa los productos del pedido antes de enviarlo.',
      })
      return
    }

    const order = await orderRepository.createOrder(req.params.accountId, payload)

    if (!order) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: 'No se encontro la cuenta para crear el pedido.',
      })
      return
    }

    res.status(201).json(order)
  } catch (error) {
    if (error?.code === 'DELIVERY_OUT_OF_AREA') {
      res.status(error.statusCode ?? 422).json({
        error: 'DELIVERY_OUT_OF_AREA',
        message: error.message,
        deliveryQuote: error.deliveryQuote ?? null,
      })
      return
    }

    if (error?.code === 'RESTAURANT_CLOSED') {
      res.status(error.statusCode ?? 409).json({
        error: 'RESTAURANT_CLOSED',
        message: error.message,
        ordering: error.ordering ?? null,
      })
      return
    }

    if (error?.code === 'ORDER_TAKING_PAUSED' || error?.ordering?.paused === true) {
      res.status(error.statusCode ?? 409).json({
        error: 'ORDER_TAKING_PAUSED',
        message: error.message,
        ordering: error.ordering ?? null,
      })
      return
    }

    res.status(500).json({
      error: 'ORDER_CREATE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo crear el pedido.',
    })
  }
})

app.get('/api/accounts/:accountId/loyalty', async (req, res) => {
  try {
    const loyalty = await loyaltyRepository.getLoyaltyByAccountId(
      req.params.accountId,
      req.query.phone,
    )

    if (!loyalty) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: 'No se encontro la cuenta para consultar puntos.',
      })
      return
    }

    res.json(loyalty)
  } catch (error) {
    res.status(500).json({
      error: 'LOYALTY_LOAD_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo consultar el programa de puntos.',
    })
  }
})

app.post('/api/accounts/:accountId/loyalty', async (req, res) => {
  try {
    const member = await loyaltyRepository.joinCommunityByAccountId(req.params.accountId, req.body ?? {})

    if (!member) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: 'No se encontro la cuenta para sumarte a la comunidad.',
      })
      return
    }

    res.json(member)
  } catch (error) {
    res.status(500).json({
      error: 'LOYALTY_JOIN_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo sumarte a la comunidad.',
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

app.delete('/api/admin/accounts/:accountId', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const result = await adminRepository.deleteMenu(req.params.accountId)

    if (!result) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada.' })
      return
    }

    res.json(result)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'MENU_DELETE_FAILED',
      message: error instanceof Error ? error.message : 'No se pudo eliminar el menu.',
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

app.post('/api/admin/accounts/:accountId/products/copy', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const result = await adminRepository.copyProductsFromAccount(
      req.params.accountId,
      req.body?.sourceAccountId,
      {
        replaceExisting: Boolean(req.body?.replaceExisting),
      },
    )

    if (!result) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta destino no encontrada.' })
      return
    }

    res.json(result)
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
})

app.post('/api/admin/products/:productId/video-upload-url', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const upload = await adminRepository.createProductVideoUpload(req.params.productId, {
      fileName: req.body?.fileName,
      contentType: req.body?.contentType,
      size: req.body?.size,
    })

    if (!upload) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' })
      return
    }

    res.json(upload)
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
})

app.post('/api/admin/accounts/:accountId/asset-upload-url', async (req, res) => {
  try {
    assertAdminToken(config, req)
    const upload = await adminRepository.createMenuAssetUpload(req.params.accountId, {
      fileName: req.body?.fileName,
      contentType: req.body?.contentType,
      size: req.body?.size,
      kind: req.body?.kind,
    })

    if (!upload) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada.' })
      return
    }

    res.json(upload)
  } catch (error) {
    if (error instanceof Error && error.code === 'UNAUTHORIZED') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token admin invalido.' })
      return
    }

    res.status(500).json({
      error: 'MENU_ASSET_UPLOAD_URL_FAILED',
      message:
        error instanceof Error ? error.message : 'No se pudo preparar la subida del asset.',
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
  console.log(`capta menu API listening on http://127.0.0.1:${config.port}`)
})

function isValidCustomerPhone(value) {
  return String(value ?? '').replace(/\D/g, '').length >= 8
}

function isValidOrderItem(item) {
  if (!item || typeof item !== 'object') return false

  const quantity = Number(item.quantity)
  const unitPrice = Number(item.unitPrice)

  return (
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0
  )
}


// ---- TABLE QR EXPERIENCE ENDPOINTS ----
app.get('/api/accounts/:accountId/tables/:mesaId/session', async (req, res) => {
  try {
    const { accountId, mesaId } = req.params;
    
    // Resolve restaurant ID first
    const restRes = await fetch(`${config.supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const restData = await restRes.json();
    if (!restData || restData.length === 0) return res.status(404).json({ error: 'Not found' });
    const restaurantId = restData[0].id;

    // Get current session
    const sessionRes = await fetch(`${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.${restaurantId}&table_id=eq.${mesaId}&status=in.(open,pending_payment,partially_paid)&select=*&limit=1`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const sessionData = await sessionRes.json();
    
    if (sessionData && sessionData.length > 0) {
      res.json(sessionData[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});


  async function resolveMesaId(restaurantId, mesaIdParam) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mesaIdParam)) {
      return mesaIdParam;
    }
    const decodedName = decodeURIComponent(mesaIdParam).toLowerCase().trim();
    const res = await fetch(`${config.supabaseUrl}/rest/v1/mesas?restaurant_id=eq.${restaurantId}&select=id,name`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const tables = await res.json();
    const matched = (tables || []).find(t => 
      t.name?.toLowerCase().trim() === decodedName ||
      t.name?.toLowerCase().trim() === `mesa ${decodedName}` ||
      t.name?.toLowerCase().trim() === `mesa${decodedName}`
    );
    return matched ? matched.id : null;
  }

  app.get('/api/accounts/:accountId/tables/:mesaId/orders', async (req, res) => {
  try {
    const { accountId, mesaId } = req.params;
    
    const restRes = await fetch(`${config.supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const restData = await restRes.json();
    if (!restData || restData.length === 0) return res.status(404).json({ error: 'Not found' });
          const restaurantId = restData[0].id;
      
      const realTableId = await resolveMesaId(restaurantId, mesaId);
      if (!realTableId) return res.json([]);
  
      const ordersRes = await fetch(`${config.supabaseUrl}/rest/v1/pedidos?restaurant_id=eq.${restaurantId}&table_id=eq.${realTableId}&status=in.(new,preparing,ready,delivering)&select=*,items_pedido(*)`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const ordersData = await ordersRes.json();
    
    res.json(ordersData || []);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/api/accounts/:accountId/tables/:mesaId/pay', express.json(), async (req, res) => {
  try {
    const { accountId, mesaId } = req.params;
    const { amount, payment_method } = req.body;
    
    const restRes = await fetch(`${config.supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const restData = await restRes.json();
    if (!restData || restData.length === 0) return res.status(404).json({ error: 'Not found' });
    const restaurantId = restData[0].id;

    const sessionRes = await fetch(`${config.supabaseUrl}/rest/v1/table_sessions?restaurant_id=eq.${restaurantId}&table_id=eq.${mesaId}&status=in.(open,pending_payment)&select=id&limit=1`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const sessionData = await sessionRes.json();
    
    if (sessionData && sessionData.length > 0) {
      const sessionId = sessionData[0].id;
      
      if (payment_method === 'mercadopago' || payment_method === 'applepay') {
        const baseUrl = String(config.dashboardUrl || '').replace(/\/+$/, '');
        const serviceKey = config.internalServiceKey || config.supabaseWriteApiKey || config.supabaseApiKey;

        const mpRes = await fetch(`${baseUrl}/api/payments/mercadopago/create-table-preference`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-capta-service-key': serviceKey,
          },
          body: JSON.stringify({
            tableSessionId: sessionId,
            amount: amount,
            accountId: accountId
          })
        });

        if (mpRes.ok) {
          const prefData = await mpRes.json();
          // The dashboard endpoint already updates table_sessions to pending_payment
          return res.json({ success: true, payment_url: prefData.paymentLink });
        } else {
          const mpErr = await mpRes.text();
          console.error("Dashboard MP Preference Error:", mpErr);
          return res.status(500).json({ error: 'Failed to create payment preference via dashboard', details: mpErr });
        }
      } else {
        // Mock payment fallback
        await fetch(`${config.supabaseUrl}/rest/v1/table_sessions?id=eq.${sessionId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            apikey: config.supabaseWriteApiKey, 
            Authorization: `Bearer ${config.supabaseWriteApiKey}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify({ status: 'paid', paid_amount: amount, closed_at: new Date().toISOString() })
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/api/accounts/:accountId/tables/:mesaId/feedback', express.json(), async (req, res) => {
  try {
    const { accountId, mesaId } = req.params;
    const { rating, comment } = req.body;
    
    const restRes = await fetch(`${config.supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id`, {
      headers: { apikey: config.supabaseApiKey, Authorization: `Bearer ${config.supabaseApiKey}` }
    });
    const restData = await restRes.json();
    if (!restData || restData.length === 0) return res.status(404).json({ error: 'Not found' });
    const restaurantId = restData[0].id;

    await fetch(`${config.supabaseUrl}/rest/v1/table_feedback`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        apikey: config.supabaseWriteApiKey, 
        Authorization: `Bearer ${config.supabaseWriteApiKey}`
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        table_id: mesaId,
        rating,
        comment,
        experience_type: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative'
      })
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});
// ------------------------------------------


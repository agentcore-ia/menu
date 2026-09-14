// ¿El pedido ya esta pago? Lo pregunta el menu cuando el cliente vuelve de
// pagar en Mercado Pago o cierra el formulario de la tarjeta.
//
// El pedido pagado con Mercado Pago nace esperando el pago y el local recien
// lo ve cuando se aprueba. Para no depender solo del aviso de Mercado Pago
// (que puede tardar), al volver se le pide al dashboard que verifique ESE
// pedido: si esta aprobado, la verificacion misma lo hace entrar al local.
//
// Mismo esquema que pagarConTarjeta.js: el navegador le habla a este servidor,
// y este reenvia al dashboard con la clave de servicio, que no sale de aca.
import { getServerConfig } from './config.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function estadoDelPago(req, res) {
  const config = getServerConfig()
  const baseUrl = String(config.dashboardUrl || '').replace(/\/+$/, '')
  const serviceKey = config.internalServiceKey || config.supabaseWriteApiKey

  if (!baseUrl || !serviceKey) {
    res.status(503).json({ message: 'No pudimos consultar el pago en este momento.' })
    return
  }

  const pedido = String(req.query?.pedido || '').trim()
  if (!UUID.test(pedido)) {
    res.status(400).json({ message: 'Pedido invalido.' })
    return
  }

  // Mercado Pago agrega el id del pago a la direccion de vuelta. Con eso la
  // verificacion va directo a ese pago en vez de buscarlo por monto.
  const pagoId = String(req.query?.payment_id || req.query?.collection_id || '').trim()

  try {
    const respuesta = await fetch(`${baseUrl}/api/payments/mercadopago/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-capta-service-key': serviceKey,
      },
      body: JSON.stringify({
        orderId: pedido,
        providerPaymentId: /^\d{4,30}$/.test(pagoId) ? pagoId : undefined,
      }),
    })

    const texto = await respuesta.text()
    const data = texto ? JSON.parse(texto) : {}

    if (!respuesta.ok) {
      res.status(respuesta.status).json({ message: data?.error || 'No pudimos consultar el pago.' })
      return
    }

    res.status(200).json({
      pagado: data?.pagado === true,
      orderNumber: data?.orderNumber ?? null,
      status: data?.status ?? null,
    })
  } catch {
    res.status(502).json({ message: 'No pudimos consultar el pago. Probá de nuevo en un momento.' })
  }
}

// Reenvia a Capta el token de la tarjeta que genero el navegador.
//
// El navegador NO le habla al dashboard directamente: manda el token aca y
// este handler lo reenvia con la clave de servicio. Asi la clave se queda del
// lado del servidor y no hay que abrirle CORS a nadie.
//
// Lo que viaja es un token de un solo uso. El numero de la tarjeta no pasa por
// aca ni por ningun servidor nuestro: eso es lo que mantiene esto en el nivel
// mas liviano de PCI.
import { getServerConfig } from './config.js'

export async function pagarConTarjeta(req, res) {
  const config = getServerConfig()
  const baseUrl = String(config.dashboardUrl || '').replace(/\/+$/, '')
  const serviceKey = config.internalServiceKey || config.supabaseWriteApiKey

  if (!baseUrl || !serviceKey) {
    res.status(503).json({ message: 'El pago con tarjeta no esta disponible en este momento.' })
    return
  }

  const cuerpo = req.body ?? {}
  if (!cuerpo.orderId || !cuerpo.token) {
    res.status(400).json({ message: 'Faltan datos de la tarjeta.' })
    return
  }

  try {
    const respuesta = await fetch(`${baseUrl}/api/payments/mercadopago/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-capta-service-key': serviceKey,
      },
      body: JSON.stringify({
        orderId: cuerpo.orderId,
        token: cuerpo.token,
        paymentMethodId: cuerpo.paymentMethodId,
        installments: cuerpo.installments,
        issuerId: cuerpo.issuerId ?? null,
        email: cuerpo.email,
        identificationType: cuerpo.identificationType ?? null,
        identificationNumber: cuerpo.identificationNumber ?? null,
      }),
    })

    const texto = await respuesta.text()
    const data = texto ? JSON.parse(texto) : {}

    if (!respuesta.ok) {
      res.status(respuesta.status).json({ message: data?.error || 'No pudimos procesar el pago.' })
      return
    }

    res.status(200).json(data)
  } catch (error) {
    // Que se caiga la conexion no puede dejar al cliente sin saber que hacer.
    res.status(502).json({
      message: 'No pudimos comunicarnos con el pago. Probá de nuevo en un momento.',
      detalle: error instanceof Error ? error.message : String(error),
    })
  }
}

// La cuenta del cliente de Capta Delivery (/api/delivery/cuenta). El menu no
// guarda nada: le pasa el pedido al dashboard (/api/public/cuenta), que manda
// el codigo por WhatsApp, verifica y lleva las sesiones.
//
//   POST { accion: "pedir_codigo", telefono }
//   POST { accion: "verificar", telefono, codigo }   -> { token, cliente }
//   GET  (Authorization: Bearer <token>)              -> { cliente, pedidos }
//   POST { accion: "actualizar" | "salir" } (con token)
import { getServerConfig } from './config.js'

const ACCIONES = new Set(['pedir_codigo', 'verificar', 'actualizar', 'salir'])

export async function cuenta(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const config = getServerConfig()
  const base = String(config.dashboardUrl || '').replace(/\/+$/, '')
  if (!base) {
    res.status(503).json({ message: 'Las cuentas no están disponibles en este momento.' })
    return
  }

  const autorizacion = String(req.headers?.authorization || '')
  const token = /^Bearer\s+[a-f0-9]{64}$/i.test(autorizacion) ? autorizacion : ''

  let cuerpo
  if (req.method === 'POST') {
    const b = req.body ?? {}
    if (!ACCIONES.has(b.accion)) {
      res.status(400).json({ message: 'Acción desconocida.' })
      return
    }
    // Solo lo que corresponde a cada accion: nada mas viaja al dashboard.
    cuerpo = {
      accion: b.accion,
      telefono: b.telefono,
      codigo: b.codigo,
      ...(b.accion === 'actualizar'
        ? Object.fromEntries(['nombre', 'direccion', 'barrio', 'ciudad'].filter((k) => k in b).map((k) => [k, b[k]]))
        : {}),
    }
  } else if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ message: 'Método no permitido.' })
    return
  }

  try {
    const respuesta = await fetch(`${base}/api/public/cuenta`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
      signal: AbortSignal.timeout(15000),
    })
    const texto = await respuesta.text()
    let datos = {}
    try {
      datos = texto ? JSON.parse(texto) : {}
    } catch {
      datos = {}
    }
    res.status(respuesta.status).json(datos)
  } catch {
    res.status(502).json({ message: 'No pudimos conectar. Probá de nuevo en un rato.' })
  }
}

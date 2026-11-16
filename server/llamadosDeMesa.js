// "LLAMAR AL MOZO" desde el QR de la mesa: lo que hace el servidor del menu.
//
// El cliente toca el boton y queda una fila en mesa_llamados; el panel del local
// la ve en el momento (Realtime) y avisa que mesa llama. Las reglas (motivos,
// vencimiento, topes) estan en shared/mesaQr.js.
//
// Lo usan las dos entradas del servidor: api/accounts/[accountId]/tables/[mesaId]/[action].js
// (Vercel) y server/index.js (local).
import {
  LLAMADOS_ABIERTOS_POR_LOCAL, LLAMADOS_POR_MESA_EN_10_MIN, LLAMADO_VENCE_MIN,
  estadoDelLlamado, mesaDelQr, motivoDeLlamado, motivoHabilitado, nombreDeMesa, notaLimpia, opcionesMesaQr,
} from '../shared/mesaQr.js'

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function base(config) {
  const clave = config.supabaseWriteApiKey || config.supabaseApiKey
  return {
    url: `${config.supabaseUrl}/rest/v1`,
    cabeceras: { apikey: clave, Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
  }
}

async function leer(config, ruta) {
  const { url, cabeceras } = base(config)
  const res = await fetch(`${url}${ruta}`, { headers: cabeceras })
  if (!res.ok) throw new Error(`lectura ${res.status}`)
  return res.json()
}

async function escribir(config, metodo, ruta, cuerpo) {
  const { url, cabeceras } = base(config)
  const res = await fetch(`${url}${ruta}`, {
    method: metodo,
    headers: { ...cabeceras, Prefer: 'return=representation' },
    body: JSON.stringify(cuerpo),
  })
  if (!res.ok) throw new Error(`escritura ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

/** Como se le muestra la mesa al cliente y al local: "A1" -> "Mesa A1". */
const etiqueta = (nombre) => nombreDeMesa(nombre) || String(nombre || '')

/**
 * Lo que ve el cliente de un llamado: nada del local ni de quien lo atendio.
 * La mesa va siempre: la pantalla la muestra aunque el QR traiga solo su
 * identificador (asi vuelve el cliente despues de pagar).
 */
function paraElCliente(llamado, nombreMesa) {
  if (!llamado) return { estado: 'ninguno', mesa: etiqueta(nombreMesa) }
  return {
    id: llamado.id,
    estado: estadoDelLlamado(llamado),
    motivo: llamado.motivo,
    mesa: etiqueta(llamado.table_name),
    creado_at: llamado.creado_at,
  }
}

const error = (status, codigo, mensaje) => ({ status, cuerpo: { error: mensaje, codigo } })

/** El local, sus opciones y la mesa del QR. */
async function contexto(config, accountId, mesaParam) {
  const locales = await leer(
    config,
    `/restaurants?slug=eq.${encodeURIComponent(accountId)}&select=id,table_experience_enabled,feedback_enabled,horarios&limit=1`,
  )
  const local = locales?.[0]
  if (!local) return { fallo: error(404, 'sin_local', 'No encontramos el local.') }
  const opciones = opcionesMesaQr(local.horarios?._settings, local)

  const mesas = await leer(config, `/mesas?restaurant_id=eq.${local.id}&select=id,name&limit=500`)
  const mesa = mesaDelQr(mesas, mesaParam)
  // Un local con el salon cargado solo recibe llamados de SUS mesas: con el
  // link a mano no se puede inventar la "Mesa 99".
  if (!mesa && (mesas || []).length > 0) return { fallo: error(404, 'sin_mesa', 'No encontramos esa mesa.') }
  const nombre = mesa?.name || nombreDeMesa(ES_UUID.test(String(mesaParam)) ? '' : mesaParam)
  if (!nombre) return { fallo: error(404, 'sin_mesa', 'No encontramos esa mesa.') }

  return { local, opciones, mesa: { id: mesa?.id || null, nombre } }
}

const desdeHace = (minutos) => encodeURIComponent(new Date(Date.now() - minutos * 60_000).toISOString())

/** El llamado abierto de la mesa (si hay), sin los vencidos. */
async function llamadoAbierto(config, localId, nombreMesa) {
  const filas = await leer(
    config,
    `/mesa_llamados?restaurant_id=eq.${localId}&table_name=eq.${encodeURIComponent(nombreMesa)}&atendido_at=is.null&creado_at=gte.${desdeHace(LLAMADO_VENCE_MIN)}&select=*&order=creado_at.desc&limit=1`,
  )
  return filas?.[0] || null
}

/**
 * Entrada unica. Devuelve { status, cuerpo } para que cada servidor conteste
 * a su manera.
 *
 *  GET   -> el estado del llamado (el de `id`, o el abierto de la mesa)
 *  POST  { motivo: 'mozo' | 'cuenta', nota? }  -> llama (no duplica: una mesa, un llamado abierto)
 *  POST  { cancelar: true, id }                -> el cliente lo cancela
 */
export async function atenderLlamadoDeMesa(config, { metodo, accountId, mesaParam, cuerpo = {}, consulta = {} }) {
  try {
    const ctx = await contexto(config, accountId, mesaParam)
    if (ctx.fallo) return ctx.fallo
    const { local, opciones, mesa } = ctx
    const habilitado = local.table_experience_enabled === true && (opciones.llamarMozo || opciones.pedirCuenta)

    if (metodo === 'GET') {
      if (!habilitado) return { status: 200, cuerpo: paraElCliente(null, mesa.nombre) }
      const id = String(consulta.id || '')
      if (ES_UUID.test(id)) {
        const filas = await leer(config, `/mesa_llamados?id=eq.${id}&restaurant_id=eq.${local.id}&select=*&limit=1`)
        // Solo el de ESTA mesa: con el id de otra no se espia nada.
        const suyo = filas?.[0] && filas[0].table_name === mesa.nombre ? filas[0] : null
        if (suyo) return { status: 200, cuerpo: paraElCliente(suyo) }
      }
      return { status: 200, cuerpo: paraElCliente(await llamadoAbierto(config, local.id, mesa.nombre), mesa.nombre) }
    }

    if (metodo !== 'POST') return error(405, 'metodo', 'Método no permitido.')
    if (!habilitado) return error(403, 'no_disponible', 'Este local no recibe llamados desde la mesa.')

    if (cuerpo.cancelar === true) {
      const id = String(cuerpo.id || '')
      if (!ES_UUID.test(id)) return error(400, 'sin_id', 'Falta el llamado a cancelar.')
      await escribir(
        config, 'PATCH',
        `/mesa_llamados?id=eq.${id}&restaurant_id=eq.${local.id}&table_name=eq.${encodeURIComponent(mesa.nombre)}&atendido_at=is.null`,
        { atendido_at: new Date().toISOString(), atendido_por: 'cliente' },
      )
      return { status: 200, cuerpo: { estado: 'cancelado' } }
    }

    const motivo = motivoDeLlamado(cuerpo.motivo)
    if (!motivoHabilitado(opciones, motivo)) return error(403, 'no_disponible', 'Esa opción no está disponible en este local.')
    const nota = notaLimpia(cuerpo.nota)

    // Una mesa, un llamado abierto: tocar de nuevo no suma otro al panel.
    const abierto = await llamadoAbierto(config, local.id, mesa.nombre)
    if (abierto) {
      if (abierto.motivo === motivo && (abierto.nota || null) === nota) return { status: 200, cuerpo: paraElCliente(abierto) }
      // Cambio lo que pide (ahora quiere la cuenta): se actualiza y vuelve a avisar.
      const [actualizado] = await escribir(config, 'PATCH', `/mesa_llamados?id=eq.${abierto.id}`, { motivo, nota, push_at: null })
      return { status: 200, cuerpo: paraElCliente(actualizado || { ...abierto, motivo, nota }) }
    }

    // El boton no es un timbre.
    const recientes = await leer(
      config,
      `/mesa_llamados?restaurant_id=eq.${local.id}&table_name=eq.${encodeURIComponent(mesa.nombre)}&creado_at=gte.${desdeHace(10)}&select=id&limit=${LLAMADOS_POR_MESA_EN_10_MIN + 1}`,
    )
    if ((recientes || []).length >= LLAMADOS_POR_MESA_EN_10_MIN) {
      return error(429, 'muchos', 'Ya avisamos varias veces. Esperá un momento antes de volver a llamar.')
    }
    const abiertosDelLocal = await leer(
      config,
      `/mesa_llamados?restaurant_id=eq.${local.id}&atendido_at=is.null&creado_at=gte.${desdeHace(LLAMADO_VENCE_MIN)}&select=id&limit=${LLAMADOS_ABIERTOS_POR_LOCAL + 1}`,
    )
    if ((abiertosDelLocal || []).length >= LLAMADOS_ABIERTOS_POR_LOCAL) {
      return error(429, 'muchos', 'Hay muchos llamados en este momento. Avisale a quien pase cerca.')
    }

    // El que quedo sin atender y ya vencio se cierra: la base admite un solo
    // llamado abierto por mesa (indice unico) y ese lo estaria ocupando.
    await escribir(
      config, 'PATCH',
      `/mesa_llamados?restaurant_id=eq.${local.id}&table_name=eq.${encodeURIComponent(mesa.nombre)}&atendido_at=is.null`,
      { atendido_at: new Date().toISOString(), atendido_por: 'vencido' },
    )
    try {
      const [creado] = await escribir(config, 'POST', '/mesa_llamados', {
        restaurant_id: local.id,
        table_id: mesa.id,
        table_name: mesa.nombre,
        motivo,
        nota,
      })
      return { status: 200, cuerpo: paraElCliente(creado) }
    } catch (e) {
      // Dos de la misma mesa tocaron a la vez: gano el otro, y es el mismo llamado.
      const ganador = await llamadoAbierto(config, local.id, mesa.nombre)
      if (ganador) return { status: 200, cuerpo: paraElCliente(ganador) }
      throw e
    }
  } catch (e) {
    console.error('[llamados-de-mesa]', e)
    return error(500, 'error', 'No pudimos avisar. Probá de nuevo.')
  }
}

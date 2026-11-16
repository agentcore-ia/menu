// LA EXPERIENCIA QR EN MESA: que se muestra y las reglas de "llamar al mozo".
//
// El local elige en el panel (Ajustes > Experiencia QR en Mesa) que ve el cliente
// al escanear el QR de su mesa. Se guarda en horarios._settings.mesaQr; lo que no
// esta guardado vale por defecto (todo a la vista). El panel tiene un gemelo de
// este archivo (Dashboard-agentcore/frontend/lib/mesaQr.ts): mismo contrato.
//
// Sin dependencias: lo usan el servidor, la pantalla y los tests.
//
//   node --test shared/mesaQr.test.mjs

/** Cada parte de la pantalla de la mesa que se puede mostrar u ocultar. */
export const OPCIONES_MESA_QR = ['bienvenida', 'verMenu', 'llamarMozo', 'pedirCuenta', 'pagar', 'propina', 'resena']

/**
 * Lo que se muestra. `restaurante` trae las columnas viejas: feedback_enabled
 * era el interruptor de las reseñas antes de que existiera mesaQr.
 */
export function opcionesMesaQr(settings, restaurante = {}) {
  const guardado = settings && typeof settings.mesaQr === 'object' && settings.mesaQr ? settings.mesaQr : {}
  const valor = (clave, porDefecto) => (typeof guardado[clave] === 'boolean' ? guardado[clave] : porDefecto)
  const opciones = {
    bienvenida: valor('bienvenida', true),
    verMenu: valor('verMenu', true),
    llamarMozo: valor('llamarMozo', true),
    pedirCuenta: valor('pedirCuenta', true),
    pagar: valor('pagar', true),
    propina: valor('propina', true),
    resena: valor('resena', restaurante.feedback_enabled !== false),
  }
  // Sin nada para tocar la pantalla queda vacia: el menu se muestra igual.
  if (!opciones.verMenu && !opciones.llamarMozo && !opciones.pedirCuenta && !opciones.pagar && !opciones.resena) {
    opciones.verMenu = true
  }
  return opciones
}

// ---------------------------------------------------------------------------
// Llamar al mozo
// ---------------------------------------------------------------------------

export const MOTIVOS_DE_LLAMADO = ['mozo', 'cuenta']
/** Un llamado sin atender deja de sonar solo pasado este tiempo. */
export const LLAMADO_VENCE_MIN = 30
/** Tope de llamados nuevos de una misma mesa en diez minutos (el boton no es un timbre). */
export const LLAMADOS_POR_MESA_EN_10_MIN = 6
/** Tope de llamados abiertos a la vez en un local. */
export const LLAMADOS_ABIERTOS_POR_LOCAL = 40
export const NOTA_MAXIMA = 120

export function motivoDeLlamado(valor) {
  return MOTIVOS_DE_LLAMADO.includes(valor) ? valor : 'mozo'
}

/** La opcion del panel que habilita cada motivo. */
export function motivoHabilitado(opciones, motivo) {
  return motivo === 'cuenta' ? opciones.pedirCuenta === true : opciones.llamarMozo === true
}

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** La nota que escribe el cliente: una linea, corta, sin saltos ni simbolos raros. */
export function notaLimpia(valor) {
  const texto = String(valor ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return texto ? texto.slice(0, NOTA_MAXIMA) : null
}

/**
 * Como se llama la mesa del QR: "5" -> "Mesa 5", "mesa 5" -> "Mesa 5",
 * "A1" -> "Mesa A1", "Barra" -> "Barra". Vacio si el texto no sirve (o es
 * el identificador interno de la mesa, que no es un nombre).
 */
export function nombreDeMesa(parametro) {
  let texto = String(parametro ?? '')
  if (ES_UUID.test(texto.trim())) return ''
  try {
    texto = decodeURIComponent(texto)
  } catch {
    // ya venia decodificado
  }
  texto = texto.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30)
  if (!texto) return ''
  const sinMesa = texto.replace(/^mesa\s*/i, '').trim()
  // "Mesa 5", "mesa5", "5" a secas o un codigo corto ("A1", "12B"). "Mesada" o
  // "Barra" no son un numero de mesa: quedan como estan.
  if (/^mesa(\s|\d|$)/i.test(texto) || /^[a-z]{0,2}\d+[a-z]?$/i.test(texto)) return sinMesa ? `Mesa ${sinMesa}` : ''
  return texto
}

/** La mesa del salon que corresponde al QR, entre las cargadas en el panel. */
export function mesaDelQr(mesas, parametro) {
  const lista = Array.isArray(mesas) ? mesas : []
  const crudo = String(parametro ?? '')
  if (ES_UUID.test(crudo)) return lista.find((m) => String(m.id).toLowerCase() === crudo.toLowerCase()) || null
  let texto = crudo
  try {
    texto = decodeURIComponent(crudo)
  } catch {
    // ya venia decodificado
  }
  const buscado = texto.toLowerCase().trim()
  if (!buscado) return null
  const igual = (nombre) => String(nombre ?? '').toLowerCase().trim()
  return (
    lista.find((m) => igual(m.name) === buscado || igual(m.name) === `mesa ${buscado}` || igual(m.name) === `mesa${buscado}`) || null
  )
}

/** Que le pasa a un llamado, visto desde el cliente. */
export function estadoDelLlamado(llamado, ahora = Date.now()) {
  if (!llamado) return 'ninguno'
  if (llamado.atendido_at) return llamado.atendido_por === 'cliente' ? 'cancelado' : 'atendido'
  const creado = Date.parse(llamado.creado_at)
  if (Number.isFinite(creado) && ahora - creado > LLAMADO_VENCE_MIN * 60_000) return 'vencido'
  return 'llamando'
}

/** "recién", "hace 1 min", "hace 12 min". */
export function haceCuanto(desde, ahora = Date.now()) {
  const minutos = Math.floor((ahora - Date.parse(desde)) / 60_000)
  if (!Number.isFinite(minutos) || minutos < 1) return 'recién'
  return `hace ${minutos} min`
}

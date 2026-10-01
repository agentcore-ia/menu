// "Pedir para más tarde": con el local cerrado, el cliente deja el pedido para
// una hora en que este abierto, en vez de irse.
//
// Como llega al local: el pedido se guarda con created_at = el momento en que
// la cocina tiene que verlo (un rato antes de la hora elegida, nunca antes de
// que abra). El panel ya trata un created_at futuro como programado: no suena,
// no imprime y no cuenta en el numero del dia hasta que llega esa hora (ver
// pedidos-programados en el dashboard).
//
// La usan el menu (que horarios ofrecer) y el servidor (validar el que llega):
// el servidor nunca confia en la hora que manda la pantalla.
//
//   node --test shared/pedidoProgramado.test.mjs

import { normalizeDaySchedule, parseTimeToMinutes } from './businessHours.js'

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const DIAS_TEXTO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
// Argentina no tiene horario de verano: UTC-3 fijo.
const OFFSET_MS = 3 * 3600 * 1000
const MIN = 60 * 1000
const DIA = 24 * 3600 * 1000

/** Cada cuanto se ofrece un horario. */
export const PASO_MINUTOS = 30
/** Cuanto antes de la hora elegida le llega el pedido a la cocina, si el local no dice. */
export const ANTICIPO_POR_DEFECTO = 40
/** Hasta cuando se puede programar: el proximo turno, no la semana que viene. */
export const HORAS_HACIA_ADELANTE = 36

/**
 * Si el local toma pedidos programados. Lo elige en Ajustes > Horarios
 * (horarios._settings.aceptaProgramados); sin elegir, viene prendido en los
 * locales de Capta Delivery. La misma regla esta en el panel (ajustes/page.tsx).
 */
export function aceptaProgramados(horarios) {
  const st = horarios?._settings || {}
  if (typeof st.aceptaProgramados === 'boolean') return st.aceptaProgramados
  return st.deliveryCapta === true
}

/**
 * Cuantos minutos antes de la hora elegida tiene que entrar el pedido: lo que
 * el local dice que tarda en entregar ("30-45 min" -> 45), entre 20 y 90.
 */
export function anticipoDelLocal(tiempoEntrega) {
  const numeros = String(tiempoEntrega ?? '').match(/\d+/g)
  if (!numeros) return ANTICIPO_POR_DEFECTO
  const mayor = Math.max(...numeros.map(Number))
  if (!Number.isFinite(mayor) || mayor <= 0) return ANTICIPO_POR_DEFECTO
  return Math.min(90, Math.max(20, mayor))
}

/** Medianoche (hora argentina) del dia en que cae `ms`, en ms UTC. */
function medianocheAR(ms) {
  return Math.floor((ms - OFFSET_MS) / DIA) * DIA + OFFSET_MS
}

/** Los tramos abiertos, como instantes, desde ayer hasta pasado mañana. */
function ventanasAbiertas(horarios, ahora) {
  const hoy = medianocheAR(ahora)
  const diaDeHoy = new Date(hoy - OFFSET_MS + 12 * 3600 * 1000).getUTCDay()
  const ventanas = []
  for (let d = -1; d <= 2; d += 1) {
    const dia = normalizeDaySchedule(horarios?.[DIAS[(diaDeHoy + d + 7) % 7]])
    if (!dia?.abierto) continue
    const base = hoy + d * DIA
    for (const tramo of dia.tramos) {
      const desde = parseTimeToMinutes(tramo.desde)
      const hasta = parseTimeToMinutes(tramo.hasta)
      if (desde === null || hasta === null) continue
      const inicio = base + desde * MIN
      // Un tramo que cruza la medianoche (20:00 a 02:00) termina al dia siguiente.
      let fin = base + hasta * MIN
      if (fin <= inicio) fin += DIA
      ventanas.push({ inicio, fin })
    }
  }
  return ventanas.sort((a, b) => a.inicio - b.inicio)
}

/** "hoy a las 21:00", "mañana a las 12:30", "el viernes a las 21:00". */
export function textoDelTurno(iso, ahora = new Date()) {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const dias = Math.round((medianocheAR(t) - medianocheAR(ahora.getTime())) / DIA)
  const local = new Date(t - OFFSET_MS)
  const hora = `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`
  const dia = dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `el ${DIAS_TEXTO[local.getUTCDay()]}`
  return `${dia} a las ${hora}`
}

/**
 * Los horarios que se le ofrecen al cliente: cada media hora dentro de lo que
 * el local esta abierto, desde que le da el tiempo de prepararlo.
 */
export function turnosParaProgramar(horarios, ahora = new Date(), { anticipo = ANTICIPO_POR_DEFECTO } = {}) {
  const ms = ahora.getTime()
  const limite = ms + HORAS_HACIA_ADELANTE * 3600 * 1000
  const paso = PASO_MINUTOS * MIN
  const turnos = []
  const vistos = new Set()

  for (const v of ventanasAbiertas(horarios, ms)) {
    // Ni antes de que pueda estar listo (abre + lo que tarda), ni antes de que
    // al local le de el tiempo desde ahora.
    const primero = Math.ceil(Math.max(v.inicio + anticipo * MIN, ms + anticipo * MIN) / paso) * paso
    for (let t = primero; t <= v.fin && t <= limite; t += paso) {
      if (vistos.has(t)) continue
      vistos.add(t)
      const iso = new Date(t).toISOString()
      turnos.push({ iso, texto: textoDelTurno(iso, ahora), inicioVentana: v.inicio })
    }
  }
  return turnos.sort((a, b) => Date.parse(a.iso) - Date.parse(b.iso))
}

/**
 * El horario que mando el cliente, validado. Devuelve cuando tiene que entrar
 * el pedido a la cocina (creadoEn) o el motivo para rechazarlo.
 */
export function validarProgramado(horarios, iso, ahora = new Date(), { anticipo = ANTICIPO_POR_DEFECTO } = {}) {
  const t = Date.parse(String(iso ?? ''))
  if (!Number.isFinite(t)) return { ok: false, mensaje: 'Elegí para cuándo querés el pedido.' }
  const turno = turnosParaProgramar(horarios, ahora, { anticipo }).find((x) => Date.parse(x.iso) === t)
  if (!turno) {
    return { ok: false, mensaje: 'Ese horario ya no está disponible. Elegí otro.' }
  }
  const creadoEn = Math.max(turno.inicioVentana, t - anticipo * MIN, ahora.getTime())
  return {
    ok: true,
    programadoPara: new Date(t).toISOString(),
    creadoEn: new Date(creadoEn).toISOString(),
    texto: turno.texto,
  }
}

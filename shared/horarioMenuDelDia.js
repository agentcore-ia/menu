// En que horario se puede pedir el MENU DEL DIA.
//
// Hay locales que tienen un menu del dia solo para una parte del dia: Babson
// tiene un menu diario nocturno que no se puede pedir al mediodia. Sin esto, el
// menu del dia se podia pedir a cualquier hora en que el local estuviera
// abierto.
//
// Vive en restaurants.horarios._settings.menuDelDiaHorario = { desde, hasta }
// ("HH:MM", hora de Argentina). Sin eso, se pide siempre que el local este
// abierto, que es como estaba. Admite pasar la medianoche (20:00 a 01:00).
//
// La usan el menu (que mostrar y que dejar agregar al carrito) y la creacion
// del pedido (que aceptar): una pestaña abierta desde el mediodia no la saltea.
//
//   node --test shared/horarioMenuDelDia.test.mjs

const ZONA = 'America/Argentina/Buenos_Aires'
const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/

const aMinutos = (hhmm) => {
  const m = String(hhmm || '').trim().match(HORA)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** El horario guardado, o null si no hay (se pide siempre). */
export function leerHorarioMenuDelDia(horarios) {
  const h = horarios?._settings?.menuDelDiaHorario
  if (!h || typeof h !== 'object') return null
  const desde = String(h.desde || '').trim()
  const hasta = String(h.hasta || '').trim()
  if (aMinutos(desde) === null || aMinutos(hasta) === null) return null
  // Desde igual a hasta no es un horario: seria "nunca" o "siempre".
  if (desde === hasta) return null
  return { desde, hasta }
}

/** Los minutos del dia en Argentina (0 a 1439). */
export function minutosEnArgentina(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(ahora)
  const hh = Number(partes.find((p) => p.type === 'hour')?.value || 0)
  const mm = Number(partes.find((p) => p.type === 'minute')?.value || 0)
  return hh * 60 + mm
}

/**
 * Si el menu del dia se puede pedir ahora.
 *
 * Sin horario, si. Con horario, dentro de [desde, hasta): a las 23:30 de un
 * "20:00 a 23:30" ya no. Si desde es mayor que hasta, cruza la medianoche.
 */
export function menuDelDiaDisponible(horario, ahora = new Date()) {
  if (!horario) return true
  const desde = aMinutos(horario.desde)
  const hasta = aMinutos(horario.hasta)
  if (desde === null || hasta === null || desde === hasta) return true
  const ahoraMin = minutosEnArgentina(ahora)
  return desde < hasta
    ? ahoraMin >= desde && ahoraMin < hasta
    : ahoraMin >= desde || ahoraMin < hasta
}

/** "de 20:00 a 23:30", para mostrarle al cliente. */
export function textoHorarioMenuDelDia(horario) {
  if (!horario) return ''
  return `de ${horario.desde} a ${horario.hasta}`
}

// Cuando se vende una promo: dias de la semana y horario.
//
// Lo arma el local desde el panel (Menu > Promociones) y vive en
// restaurant_menu_presentations.theme_overrides.promociones:
//
//   [{ productoId, dias: [1,2,3,4], desde: "19:00", hasta: "23:30" }]
//
//   - dias: 0 = domingo ... 6 = sabado. Vacio = todos los dias.
//   - desde / hasta: "HH:MM" en hora argentina. Vacios = sin limite de hora.
//     Si "hasta" es menor que "desde" el horario cruza la medianoche
//     ("22:00" a "02:00"): la promo es del dia en que arranca.
//
// El menu la esconde fuera de horario y el servidor frena el pedido igual.
// Gemelo en el panel: Dashboard-agentcore/frontend/lib/promociones.ts.

const NOMBRES_DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

const horaValida = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t || ''))
const aMinutos = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

/** Limpia lo guardado: solo promos con producto, dias 0-6 sin repetir y horas validas. */
export function normalizarPromociones(crudo) {
  const salida = []
  const vistos = new Set()
  for (const item of Array.isArray(crudo) ? crudo : []) {
    const productoId = String(item?.productoId || '').trim()
    if (!productoId || vistos.has(productoId)) continue
    vistos.add(productoId)
    const dias = [...new Set((Array.isArray(item?.dias) ? item.dias : []).map(Number))]
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b)
    salida.push({
      productoId,
      dias: dias.length === 7 ? [] : dias,
      desde: horaValida(item?.desde) ? item.desde : '',
      hasta: horaValida(item?.hasta) ? item.hasta : '',
    })
  }
  return salida
}

/** Dia (0 = domingo) y minutos desde las 00:00, en hora argentina. */
export function momentoEnArgentina(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha)
  const valor = (tipo) => partes.find((p) => p.type === tipo)?.value ?? ''
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(valor('weekday'))
  return { dia, minutos: Number(valor('hour')) * 60 + Number(valor('minute')) }
}

/** Si la promo se puede vender en este momento. Sin dias ni horas, siempre. */
export function promoVigente(promo, fecha = new Date()) {
  if (!promo) return true
  const dias = Array.isArray(promo.dias) ? promo.dias : []
  const { dia, minutos } = momentoEnArgentina(fecha)
  const tocaElDia = (d) => !dias.length || dias.includes(d)

  const desde = horaValida(promo.desde) ? aMinutos(promo.desde) : null
  const hasta = horaValida(promo.hasta) ? aMinutos(promo.hasta) : null

  if (desde === null && hasta === null) return tocaElDia(dia)

  // Horario que cruza la medianoche: despues de las 00:00 sigue siendo la
  // promo del dia anterior.
  if (desde !== null && hasta !== null && hasta < desde) {
    if (minutos >= desde) return tocaElDia(dia)
    if (minutos < hasta) return tocaElDia((dia + 6) % 7)
    return false
  }

  if (!tocaElDia(dia)) return false
  if (desde !== null && minutos < desde) return false
  if (hasta !== null && minutos >= hasta) return false
  return true
}

/** "lunes a jueves" / "martes y sábados" / "todos los días". */
export function describirDiasPromo(dias) {
  const lista = [...new Set(dias || [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  if (!lista.length || lista.length === 7) return 'todos los días'
  const consecutivos = lista.every((d, i) => i === 0 || (lista[i - 1] + 1) % 7 === d)
  if (lista.length >= 3 && consecutivos) return `${NOMBRES_DIAS[lista[0]]} a ${NOMBRES_DIAS[lista[lista.length - 1]]}`
  const nombres = lista.map((d) => NOMBRES_DIAS[d])
  if (nombres.length === 1) return nombres[0]
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

/** El texto para el cliente: "lunes a jueves de 19:00 a 23:30". */
export function describirVigencia(promo) {
  const dias = describirDiasPromo(promo?.dias)
  const desde = horaValida(promo?.desde) ? promo.desde : ''
  const hasta = horaValida(promo?.hasta) ? promo.hasta : ''
  const horas = desde && hasta ? ` de ${desde} a ${hasta}` : desde ? ` desde las ${desde}` : hasta ? ` hasta las ${hasta}` : ''
  return `${dias}${horas}`
}

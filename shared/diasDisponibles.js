// Productos que solo se venden algunos dias de la semana.
//
// Lo dice la descripcion del producto, igual que "Solo efectivo": el local ya
// lo escribe para el cliente ("De lunes a jueves") y asi se cambia desde la
// pantalla de productos sin nada nuevo. Si la descripcion no nombra dias, el
// producto se vende todos los dias.
//
// Se usa en el menu (el producto y su cartel de promo no aparecen fuera de sus
// dias) y al crear el pedido (el servidor lo rechaza aunque lo manden a mano).

const DIAS = [
  ['domingo', 'domingos', 'dom'],
  ['lunes', 'lun'],
  ['martes', 'mar'],
  ['miercoles', 'mie'],
  ['jueves', 'jue'],
  ['viernes', 'vie'],
  ['sabado', 'sabados', 'sab'],
]

const NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function limpio(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function numeroDeDia(palabra) {
  const i = DIAS.findIndex((nombres) => nombres.includes(palabra))
  return i >= 0 ? i : null
}

const PALABRA_DIA = '(domingos?|lunes|martes|miercoles|jueves|viernes|sabados?)'

/**
 * Los dias (0 = domingo ... 6 = sabado) en que se vende, o null si el texto no
 * limita los dias.
 *
 * Entiende rangos ("de lunes a jueves") y dias despues de "solo" ("solo los
 * sabados", "solo martes y jueves").
 */
export function diasDelTexto(texto) {
  const t = limpio(texto)
  if (!t) return null

  const dias = new Set()
  // Con el "de" adelante: "lunes a viernes al mediodia" suele ser el horario
  // del local, no una restriccion del producto.
  const rango = new RegExp(`\\bde\\s+${PALABRA_DIA}\\s+a(?:l)?\\s+${PALABRA_DIA}\\b`, 'g')
  let resto = t
  for (const m of t.matchAll(rango)) {
    const desde = numeroDeDia(m[1])
    const hasta = numeroDeDia(m[2])
    if (desde === null || hasta === null) continue
    // "de viernes a domingo" da la vuelta a la semana.
    for (let d = desde; ; d = (d + 1) % 7) {
      dias.add(d)
      if (d === hasta) break
    }
    resto = resto.replace(m[0], ' ')
  }

  // Dias sueltos solo detras de "solo": "solo los sabados", "solo martes y
  // jueves". Un dia nombrado de pasada ("el lunes viene incluido", en un pack
  // de viandas) no limita nada: sin esta condicion ese producto desaparecia
  // del menu seis dias de la semana.
  const soloDias = new RegExp(`\\bsolo\\s+(?:los\\s+|el\\s+)?(${PALABRA_DIA}(?:\\s*(?:,|y|e)\\s*(?:los\\s+|el\\s+)?${PALABRA_DIA})*)`, 'g')
  for (const m of resto.matchAll(soloDias)) {
    for (const palabra of m[1].matchAll(new RegExp(PALABRA_DIA, 'g'))) {
      const d = numeroDeDia(palabra[1])
      if (d !== null) dias.add(d)
    }
  }

  return dias.size ? dias : null
}

/** El dia de la semana en Argentina (0 = domingo), sea donde sea que corra el servidor. */
export function diaDeHoyEnArgentina(fecha = new Date()) {
  const nombre = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
  }).format(fecha)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(nombre)
}

/** Si el producto se puede vender ese dia, segun su nombre y descripcion. */
export function productoDisponibleHoy(producto, fecha = new Date()) {
  const dias = diasDelTexto(`${producto?.name || ''} ${producto?.description || ''}`)
  if (!dias) return true
  return dias.has(diaDeHoyEnArgentina(fecha))
}

/** "de lunes a jueves" / "los martes y jueves", para el mensaje de rechazo. */
export function describirDias(dias) {
  const lista = [...dias].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  const consecutivos = lista.every((d, i) => i === 0 || (lista[i - 1] + 1) % 7 === d)
  if (lista.length >= 3 && consecutivos) return `de ${NOMBRES[lista[0]]} a ${NOMBRES[lista[lista.length - 1]]}`
  const nombres = lista.map((d) => NOMBRES[d])
  if (nombres.length === 1) return `los ${nombres[0]}${/[oa]$/.test(nombres[0]) ? 's' : ''}`
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

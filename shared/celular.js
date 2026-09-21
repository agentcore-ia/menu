// El celular del cliente en el checkout del menu digital.
//
// Es obligatorio en todos los menus: con el se le avisa el estado del pedido,
// lo llama el repartidor y se le suman los puntos. Antes bastaba con 8 numeros
// cualesquiera y el servidor no lo exigia (un pedido armado a mano entraba con
// "menu-sin-telefono").
//
// Se normaliza al formato de WhatsApp de Argentina, 549 + caracteristica +
// numero, y es valido si quedan exactamente 13 digitos: eso asegura que tenga
// la caracteristica y el largo de un celular de verdad. Acepta como lo
// escribe la gente: "2346 15 587122", "02346-587122", "+54 9 2346 587122".
//
//   node --test shared/celular.test.mjs

export function normalizarCelular(valor) {
  let digitos = String(valor ?? '').replace(/\D/g, '')
  if (!digitos) return ''
  digitos = digitos.replace(/^00/, '')

  if (digitos.startsWith('549')) return `549${sacarQuince(digitos.slice(3))}`

  if (digitos.startsWith('54')) {
    const nacional = digitos.slice(2).replace(/^0+/, '')
    return `549${sacarQuince(nacional.replace(/^9/, ''))}`
  }

  digitos = digitos.replace(/^0+/, '')

  // "15 xxxx xxxx" sin caracteristica: el "15" de siempre era Buenos Aires.
  if (digitos.startsWith('15') && digitos.length >= 10) return `54911${digitos.slice(2)}`

  return `549${sacarQuince(digitos)}`
}

/**
 * Saca el "15" que va entre la caracteristica y el numero. La caracteristica
 * tiene 2, 3 o 4 digitos, y caracteristica + numero siempre suman 10: con el
 * 15 en el medio son 12.
 */
function sacarQuince(valor) {
  if (valor.startsWith('11') && valor.slice(2, 4) === '15') return `11${valor.slice(4)}`
  if (valor.length === 12) {
    // Caracteristica de 3 (221 15 xxxxxxx) o de 4 (2346 15 xxxxxx).
    if (valor.slice(3, 5) === '15') return `${valor.slice(0, 3)}${valor.slice(5)}`
    if (valor.slice(4, 6) === '15') return `${valor.slice(0, 4)}${valor.slice(6)}`
  }
  if (valor.length >= 13 && valor.slice(4, 6) === '15') return `${valor.slice(0, 4)}${valor.slice(6)}`
  return valor
}

/** Si alcanza para contactar al cliente: un celular argentino completo. */
export function celularValido(valor) {
  return /^549\d{10}$/.test(normalizarCelular(valor))
}

export const MENSAJE_CELULAR_INVALIDO =
  'Poné tu celular con la característica, por ejemplo 2346 15 587122. Lo necesitamos para avisarte de tu pedido.'

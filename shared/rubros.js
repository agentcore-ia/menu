// Que tipo de negocio es el local, para el menu digital.
//
// Espejo chico de lib/rubros.ts del dashboard: aca solo hace falta saber COMO
// hablarle al cliente. Un kiosco no tiene "menu" ni "platos", tiene productos.
//
// Lo que NO cambia es como se arma el pedido: el carrito, los precios, el envio
// y el pago son los mismos para todos. Solo cambian las palabras.

const RUBROS = {
  restaurante: {
    id: 'restaurante',
    catalogo: 'Menu digital',
    kicker: 'MENU DESTACADO',
    heroTitulo: 'Cocina honesta,',
    heroAcento: 'mesa vibrante',
    heroTexto: 'Platos directos, producto fuerte y una carta pensada para convertir.',
  },
  comercio: {
    id: 'comercio',
    catalogo: 'Catalogo online',
    kicker: 'DESTACADOS',
    heroTitulo: 'Todo lo que buscás,',
    heroAcento: 'a un toque',
    heroTexto: 'Elegí lo que necesitás y te lo llevamos.',
  },
  panaderia: {
    id: 'panaderia',
    catalogo: 'Catalogo online',
    kicker: 'DESTACADOS',
    heroTitulo: 'Recién hecho,',
    heroAcento: 'todos los días',
    heroTexto: 'Panificados, facturas y algo dulce para cualquier momento.',
  },
}

// Los rubros del dashboard que se comportan igual de este lado.
const EQUIVALE = {
  restaurante: 'restaurante',
  panaderia: 'panaderia',
  kiosco: 'comercio',
  dietetica: 'comercio',
  farmacia: 'comercio',
  otro: 'comercio',
}

/**
 * El rubro del local, leido de sus ajustes.
 *
 * Sin nada configurado es un restaurante: todos los locales que hay hoy lo son
 * y no pueden cambiar de aspecto por este cambio.
 */
export function rubroDelMenu(businessHours) {
  const settings =
    businessHours && typeof businessHours === 'object' && !Array.isArray(businessHours)
      ? businessHours._settings
      : null
  const id = String(settings?.rubro ?? '').trim()
  return RUBROS[EQUIVALE[id]] ?? RUBROS.restaurante
}

/** Las palabras de ese rubro, para la pantalla. */
export function textosDelMenu(rubro) {
  return RUBROS[rubro] ?? RUBROS.restaurante
}

export { RUBROS }

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
    // El menu que cambia dia a dia es de restaurantes.
    menuDelDia: true,
    catalogo: 'Menu digital',
    kicker: 'MENU DESTACADO',
    heroTitulo: 'Cocina honesta,',
    heroAcento: 'mesa vibrante',
    heroTexto: 'Platos directos, producto fuerte y una carta pensada para convertir.',
  },
  comercio: {
    id: 'comercio',
    // El menu que cambia dia a dia es de restaurantes.
    menuDelDia: false,
    catalogo: 'Catalogo online',
    kicker: 'DESTACADOS',
    heroTitulo: 'Todo lo que buscás,',
    heroAcento: 'a un toque',
    heroTexto: 'Elegí lo que necesitás y te lo llevamos.',
  },
  panaderia: {
    id: 'panaderia',
    // El menu que cambia dia a dia es de restaurantes.
    menuDelDia: false,
    catalogo: 'Catalogo online',
    kicker: 'DESTACADOS',
    heroTitulo: 'Recién hecho,',
    heroAcento: 'todos los días',
    heroTexto: 'Panificados, facturas y algo dulce para cualquier momento.',
  },
}

// Los rubros del dashboard que se comportan igual de este lado.
const EQUIVALE_RUBRO = {
  restaurante: 'restaurante',
  panaderia: 'panaderia',
  kiosco: 'comercio',
  dietetica: 'comercio',
  farmacia: 'comercio',
  otro: 'comercio',
}

// Los valores de `restaurants.business_type`, que es OTRO vocabulario: ahi
// "otro" quiere decir "otro rubro gastronomico", o sea un restaurante. Usar un
// solo mapa para los dos hacia que un bar cargado como "otro" apareciera como
// comercio. Lo que no esta listado es gastronomico y va a restaurante.
const EQUIVALE_ALTA = {
  panaderia: 'panaderia',
  kiosco: 'comercio',
  dietetica: 'comercio',
  farmacia: 'comercio',
  comercio: 'comercio',
}

/**
 * El rubro del local, leido de sus ajustes.
 *
 * Sin nada configurado es un restaurante: todos los locales que hay hoy lo son
 * y no pueden cambiar de aspecto por este cambio.
 */
export function rubroDelMenu(businessHours, businessType) {
  const settings =
    businessHours && typeof businessHours === 'object' && !Array.isArray(businessHours)
      ? businessHours._settings
      : null

  // Primero lo que el local eligio a mano; si no toco nada, lo que se cargo al
  // crear la cuenta (business_type), que es donde estuvo el dato siempre.
  const aMano = String(settings?.rubro ?? '').trim()
  if (EQUIVALE_RUBRO[aMano]) return RUBROS[EQUIVALE_RUBRO[aMano]]

  const delAlta = String(businessType ?? '').trim().toLowerCase()
  return RUBROS[EQUIVALE_ALTA[delAlta]] ?? RUBROS.restaurante
}

/** Las palabras de ese rubro, para la pantalla. */
export function textosDelMenu(rubro) {
  return RUBROS[rubro] ?? RUBROS.restaurante
}

export { RUBROS }

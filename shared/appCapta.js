// capta.ar (la app Capta Delivery) y sus pedidos: se pueden cerrar hasta que el dueño la lance.
//
// Quedan CERRADOS mientras capta_ajustes, clave 'app_pedidos', no diga { habilitado: true }
// (se prende desde el panel: Capta Delivery > Vitrina capta.ar). Sin esa fila, cerrados.
//
// Solo toca lo que entra por la app: los pedidos que vienen de la vitrina, los hechos en sus
// direcciones y los mandados. El menu propio de cada local (menu.net.ar/<local>,
// dolce.capta.ar, el QR de la mesa) sigue tomando pedidos como siempre.

export const CLAVE_AJUSTE_APP = 'app_pedidos'

export const MENSAJE_APP_SIN_LANZAR =
  'Muy pronto vas a poder pedir por Capta. Todavía no estamos tomando pedidos.'

// Las direcciones de la app. Los subdominios de un local (dolce.capta.ar) no son la app.
const DOMINIOS_DE_LA_APP = new Set(['capta.ar', 'www.capta.ar', 'delivery.capta.ar', 'pedi.menu.net.ar'])

export function esDominioDeLaApp(host) {
  const limpio = String(host ?? '').trim().toLowerCase().split(':')[0].replace(/\.$/, '')
  return DOMINIOS_DE_LA_APP.has(limpio)
}

/** Si este pedido entra por la app: vino de la vitrina, o se hizo en una direccion de la app. */
export function esPedidoDeLaApp({ host, desdeVitrina, mesa } = {}) {
  if (desdeVitrina === true) return true
  return !mesa && esDominioDeLaApp(host)
}

/** Solo un "habilitado: true" explicito abre los pedidos. */
export function appHabilitada(valor) {
  return valor?.habilitado === true
}

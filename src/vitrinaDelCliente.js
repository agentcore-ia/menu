// Si el cliente llego al menu DESDE la vitrina de Capta Delivery.
//
// El link de la vitrina trae ?vitrina=1. Se guarda en la sesion del navegador
// porque el menu limpia la direccion (replaceState) al volver de un pago, y
// porque el cliente sigue viniendo de la app aunque navegue por el menu.
//
// De esto dependen dos cosas: el boton para volver a la vitrina y los puntos
// de Capta, que solo suman y se canjean en los pedidos que entraron por ahi.

const CLAVE = 'capta-vino-de-la-vitrina'

export function vinoDeLaVitrina() {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('vitrina') === '1') {
      window.sessionStorage?.setItem(CLAVE, '1')
      return true
    }
    return window.sessionStorage?.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

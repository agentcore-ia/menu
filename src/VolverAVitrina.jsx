// El boton para volver a la vitrina de Capta Delivery.
//
// Cuando el cliente entra al menu de un local DESDE la vitrina (/pedi), el link
// trae ?vitrina=1. Sin esto, la unica forma de volver a la lista de locales es
// el boton de atras del navegador, y en el celular eso se pierde apenas navega
// un poco por el menu.
//
// Vive al lado de MenuApp y no adentro: el menu de cada local no tiene por que
// saber que existe una vitrina. Se acuerda en la sesion del navegador porque el
// menu limpia la direccion (replaceState) al volver de un pago.

import { useState } from 'react'

const CLAVE = 'capta-vino-de-la-vitrina'

function vinoDeLaVitrina() {
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

export default function VolverAVitrina() {
  // Se mira una sola vez, al montar: el cliente no deja de venir de la vitrina
  // por navegar dentro del menu.
  const [visible] = useState(vinoDeLaVitrina)

  if (!visible) return null

  return (
    <a className="volver-a-vitrina" href="/pedi">
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Capta Delivery
    </a>
  )
}

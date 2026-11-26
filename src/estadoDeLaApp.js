// Si capta.ar esta cerrado a pedidos (la app todavia no se lanzo).
//
// Es solo para avisarle al cliente antes de que arme el pedido: la regla la aplica el
// servidor. Mientras no responde (o si falla) devuelve false, para no mostrar el aviso
// por las dudas una vez que la app este lanzada.

import { useEffect, useState } from 'react'

export function useAppSinPedidos(activo) {
  const [cerrada, setCerrada] = useState(false)

  useEffect(() => {
    if (!activo) return undefined
    let vivo = true
    fetch('/api/delivery/estado')
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos) => {
        if (vivo && datos) setCerrada(datos.pedidos === false)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [activo])

  return Boolean(activo && cerrada)
}

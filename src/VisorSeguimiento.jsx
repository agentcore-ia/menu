// Seguir un pedido SIN salir de la pagina: la pantalla de seguimiento se abre encima, dentro de la
// misma pagina, y al cerrarla (o con "atras" del celular) se vuelve a donde estaba el cliente.
//
// Toma todos los links de seguimiento de la vitrina (pedidos, mandados) con un solo escuchador de clicks,
// asi no hay que cambiar cada boton. Si algo falla, el link sigue siendo un link normal.
import { useEffect, useState } from 'react'

const HOST_SEGUIMIENTO = 'seguimiento.capta.ar'

/** El link si es de seguimiento de Capta; si no, null. */
function linkDeSeguimiento(href) {
  try {
    const url = new URL(href, window.location.href)
    if (url.protocol !== 'https:' || url.hostname !== HOST_SEGUIMIENTO) return null
    return url.pathname.startsWith('/seguimiento/') ? url.href : null
  } catch {
    return null
  }
}

export function VisorSeguimiento() {
  const [url, setUrl] = useState(null)

  // Cualquier click en un link de seguimiento lo abre aca adentro (salvo ctrl/cmd/shift o boton del medio,
  // que siguen abriendo una pestana como siempre).
  useEffect(() => {
    const alTocar = (evento) => {
      if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return
      const ancla = evento.target instanceof Element ? evento.target.closest('a[href]') : null
      const destino = ancla ? linkDeSeguimiento(ancla.getAttribute('href')) : null
      if (!destino) return
      evento.preventDefault()
      try {
        window.history.pushState({ seguimiento: true }, '')
      } catch {
        // sin historial: se cierra igual con el boton
      }
      setUrl(destino)
    }
    document.addEventListener('click', alTocar)
    return () => document.removeEventListener('click', alTocar)
  }, [])

  // "Atras" del celular y Escape cierran el visor, no la pagina.
  useEffect(() => {
    if (!url) return undefined
    const alVolver = () => setUrl(null)
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') window.history.back()
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('popstate', alVolver)
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('popstate', alVolver)
      window.removeEventListener('keydown', alTeclear)
    }
  }, [url])

  if (!url) return null

  const cerrar = () => {
    // Volver un paso en el historial dispara popstate, que cierra el visor.
    if (window.history.state?.seguimiento) window.history.back()
    else setUrl(null)
  }

  return (
    <div className="cd-visor" role="dialog" aria-modal="true" aria-label="Seguimiento de tu pedido">
      <div className="cd-visor-barra">
        <button type="button" className="cd-visor-volver" onClick={cerrar}>
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
          Volver
        </button>
        <strong>Seguimiento de tu pedido</strong>
      </div>
      <iframe className="cd-visor-marco" src={url} title="Seguimiento de tu pedido" allow="geolocation" />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

export default function SliderComercios({ children, cantidad }) {
  const pista = useRef(null)
  const [limites, setLimites] = useState({ atras: false, adelante: false })

  useEffect(() => {
    const elemento = pista.current
    const medir = () => {
      const atras = elemento.scrollLeft > 2
      const adelante = elemento.scrollWidth - elemento.clientWidth - elemento.scrollLeft > 2
      setLimites((actual) => actual.atras === atras && actual.adelante === adelante ? actual : { atras, adelante })
    }
    const observer = new ResizeObserver(medir)
    observer.observe(elemento)
    elemento.addEventListener('scroll', medir, { passive: true })
    medir()
    return () => {
      observer.disconnect()
      elemento.removeEventListener('scroll', medir)
    }
  }, [cantidad])

  const mover = (sentido) => {
    const elemento = pista.current
    elemento.scrollBy({
      left: sentido * elemento.clientWidth * 0.75,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  return (
    <div className="cd-slider-comercios">
      <div className="cd-slider-pista" ref={pista} role="group" aria-label="Comercios abiertos"
        tabIndex={limites.atras || limites.adelante ? 0 : undefined}>
        {children}
      </div>
      {limites.atras || limites.adelante ? (
        <div className="cd-slider-controles" aria-label="Controles del carrusel">
          <button type="button" aria-label="Ver comercios anteriores" onClick={() => mover(-1)} disabled={!limites.atras}>
            <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
          </button>
          <button type="button" aria-label="Ver más comercios" onClick={() => mover(1)} disabled={!limites.adelante}>
            <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

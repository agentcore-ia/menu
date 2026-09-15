// El cliente marca en el mapa donde le llevan el pedido, como en las apps de
// delivery: se detecta la ubicacion del telefono, aparece el mapa con un pin
// fijo en el centro y el cliente mueve el mapa hasta dejar el pin en su puerta.
//
// Leaflet y OpenStreetMap se cargan del CDN recien al abrir: el mapa no le
// suma peso a nadie que no lo use. CARTO no: exige clave y estampa "API KEY
// REQUIRED" sobre el mapa.
//
// La direccion aproximada la busca el servidor (delivery-zone?reverse=1), con
// una espera despues de soltar el mapa: OpenStreetMap no admite una consulta
// por cada movimiento.
import { useCallback, useEffect, useRef, useState } from 'react'
import { puntoValido } from '../shared/ubicacionCliente.js'

/** Sin ubicacion del local ni del cliente, el mapa arranca en Chivilcoy. */
const CENTRO_POR_DEFECTO = { lat: -34.8948, lng: -60.0065 }
const ZOOM_CERCA = 17
const MS_ANTES_DE_BUSCAR = 700

async function cargarLeaflet() {
  if (window.L) return window.L

  if (!document.querySelector('link[data-leaflet-css="true"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.dataset.leafletCss = 'true'
    document.head.appendChild(link)
  }

  await new Promise((resolve, reject) => {
    const existente = document.querySelector('script[data-leaflet-js="true"]')
    if (existente) {
      if (window.L) {
        resolve()
        return
      }
      existente.addEventListener('load', () => resolve(), { once: true })
      existente.addEventListener('error', () => reject(new Error('mapa')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.dataset.leafletJs = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('mapa'))
    document.body.appendChild(script)
  })
  return window.L
}

function IconoPin() {
  return (
    <svg viewBox="0 0 40 52" width="40" height="52" aria-hidden="true">
      <path d="M20 0C9 0 0 8.9 0 19.9 0 34.8 20 52 20 52s20-17.2 20-32.1C40 8.9 31 0 20 0z" fill="currentColor" />
      <circle cx="20" cy="20" r="7.5" fill="#fff" />
    </svg>
  )
}

function IconoMiUbicacion() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
    </svg>
  )
}

export default function UbicacionEnMapa({ accountId, inicial, centroLocal, detectarAlAbrir, onConfirmar, onCerrar }) {
  const contenedor = useRef(null)
  const mapa = useRef(null)
  const circulo = useRef(null)
  const ultimaBusqueda = useRef(0)
  const [estado, setEstado] = useState('cargando')
  const [aviso, setAviso] = useState('')
  const [centro, setCentro] = useState(null)
  const [direccion, setDireccion] = useState({ texto: '', etiqueta: '', buscando: false })
  const [precision, setPrecision] = useState(null)
  const [fuente, setFuente] = useState('mapa')

  const buscarDireccion = useCallback(async (punto) => {
    const numero = ++ultimaBusqueda.current
    setDireccion((d) => ({ ...d, buscando: true }))
    try {
      const params = new URLSearchParams({ reverse: '1', lat: String(punto.lat), lng: String(punto.lng) })
      const res = await fetch(`/api/accounts/${encodeURIComponent(accountId)}/delivery-zone?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json().catch(() => null)
      // Si el mapa se movio mientras tanto, esta respuesta ya es de otro lugar.
      if (numero !== ultimaBusqueda.current) return
      setDireccion({
        texto: res.ok ? String(json?.direccion || '') : '',
        etiqueta: res.ok ? String(json?.etiqueta || '') : '',
        buscando: false,
      })
    } catch {
      if (numero === ultimaBusqueda.current) setDireccion({ texto: '', etiqueta: '', buscando: false })
    }
  }, [accountId])

  const detectar = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setAviso('Tu teléfono no permite detectar la ubicación. Mové el mapa hasta tu puerta.')
      setEstado('listo')
      return
    }
    setEstado('detectando')
    setAviso('')
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const punto = { lat: posicion.coords.latitude, lng: posicion.coords.longitude }
        const exactitud = Number(posicion.coords.accuracy)
        const m = mapa.current
        const L = window.L
        setPrecision(Number.isFinite(exactitud) ? exactitud : null)
        setFuente('gps')
        if (m && L) {
          m.setView([punto.lat, punto.lng], ZOOM_CERCA)
          if (circulo.current) circulo.current.remove()
          circulo.current = null
          // El circulo dice cuanto puede errar el GPS: con uno grande se ve
          // que hay que acomodar el pin.
          if (Number.isFinite(exactitud) && exactitud > 15 && exactitud < 3000) {
            circulo.current = L.circle([punto.lat, punto.lng], {
              radius: exactitud, color: '#2563eb', weight: 1, fillOpacity: 0.08, interactive: false,
            }).addTo(m)
          }
        }
        setAviso(
          Number.isFinite(exactitud) && exactitud > 60
            ? 'Ubicación aproximada: mové el mapa hasta que el pin quede en tu puerta.'
            : 'Revisá que el pin quede justo en tu puerta.',
        )
        setEstado('listo')
      },
      (error) => {
        setAviso(
          error?.code === 1
            ? 'No diste permiso para usar tu ubicación. Mové el mapa hasta tu puerta.'
            : 'No pudimos detectar tu ubicación. Mové el mapa hasta tu puerta.',
        )
        setEstado('listo')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  }, [])

  // Crear el mapa una sola vez, al abrir.
  useEffect(() => {
    let cancelado = false
    let espera = null
    const deInicio = puntoValido(inicial)
    const inicio = deInicio || puntoValido(centroLocal) || CENTRO_POR_DEFECTO

    cargarLeaflet()
      .then((L) => {
        if (cancelado || !L || !contenedor.current || mapa.current) return
        const m = L.map(contenedor.current, { zoomControl: false, attributionControl: true })
          .setView([inicio.lat, inicio.lng], deInicio ? ZOOM_CERCA : 15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(m)
        L.control.zoom({ position: 'bottomright' }).addTo(m)
        mapa.current = m

        const alMover = () => {
          const c = m.getCenter()
          const punto = { lat: c.lat, lng: c.lng }
          setCentro(punto)
          window.clearTimeout(espera)
          espera = window.setTimeout(() => { void buscarDireccion(punto) }, MS_ANTES_DE_BUSCAR)
        }
        m.on('moveend', alMover)
        // Si lo mueve con el dedo, el punto ya no es el del GPS.
        m.on('dragstart', () => setFuente('mapa'))

        // Leaflet mide el contenedor al crearse: si el modal se estaba
        // acomodando, las piezas quedan corridas.
        requestAnimationFrame(() => {
          if (cancelado || !mapa.current) return
          mapa.current.invalidateSize()
          alMover()
        })
        setEstado('listo')
        if (detectarAlAbrir) detectar()
      })
      .catch(() => {
        if (cancelado) return
        setEstado('error')
        setAviso('No se pudo cargar el mapa. Escribí tu dirección a mano.')
      })

    return () => {
      cancelado = true
      window.clearTimeout(espera)
      if (mapa.current) {
        mapa.current.remove()
        mapa.current = null
      }
    }
    // Solo al abrir: moverse lo maneja el propio mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mientras esta abierto, la pagina de atras no se desplaza y Escape cierra.
  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const alTeclear = (event) => {
      if (event.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', alTeclear)
    }
  }, [onCerrar])

  const confirmar = () => {
    const punto = puntoValido(centro)
    if (!punto) return
    onConfirmar({
      lat: punto.lat,
      lng: punto.lng,
      direccion: direccion.texto,
      label: direccion.etiqueta || direccion.texto || '',
      precision: fuente === 'gps' ? precision : null,
      fuente,
    })
  }

  const textoDireccion = direccion.buscando
    ? 'Buscando la dirección…'
    : direccion.texto || direccion.etiqueta || (centro ? 'Punto marcado en el mapa' : '')

  return (
    <div className="mapa-ubicacion-fondo" role="dialog" aria-modal="true" aria-label="Marcá dónde entregar el pedido">
      <div className="mapa-ubicacion">
        <header className="mapa-ubicacion-cabecera">
          <div>
            <strong>¿Dónde te lo llevamos?</strong>
            <span>Mové el mapa hasta que el pin quede en tu puerta.</span>
          </div>
          <button type="button" className="mapa-ubicacion-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="mapa-ubicacion-lienzo">
          <div ref={contenedor} className="mapa-ubicacion-mapa" />
          <div className="mapa-ubicacion-pin" aria-hidden="true">
            <IconoPin />
          </div>
          <span className="mapa-ubicacion-sombra" aria-hidden="true" />
          <button
            type="button"
            className="mapa-ubicacion-gps"
            onClick={detectar}
            disabled={estado === 'detectando' || estado === 'error'}
          >
            <IconoMiUbicacion />
            {estado === 'detectando' ? 'Buscando…' : 'Mi ubicación'}
          </button>
        </div>

        <div className="mapa-ubicacion-pie">
          {aviso ? <p className="mapa-ubicacion-aviso">{aviso}</p> : null}
          <div className="mapa-ubicacion-direccion">
            <span>Entregar en</span>
            <strong>{textoDireccion || '—'}</strong>
          </div>
          <button
            type="button"
            className="mapa-ubicacion-confirmar"
            onClick={confirmar}
            disabled={!centro || estado === 'error' || estado === 'cargando'}
          >
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  )
}

// EL LLAMADO AL MOZO de una mesa (QR): su estado y el color de la pantalla.
// Los componentes que lo muestran estan en src/LlamarMozo.jsx.
import { useCallback, useEffect, useRef, useState } from 'react'

// --- El color del local -------------------------------------------------------

/**
 * El acento de la pantalla: el color del local si se lee bien sobre blanco, y
 * el texto que va encima. Un amarillo claro o un blanco no sirven de boton.
 */
export function coloresDeMesa(colorDelLocal) {
  const porDefecto = { '--mq-acento': '#1c1c1e', '--mq-sobre-acento': '#ffffff' }
  const hex = String(colorDelLocal || '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
  if (!hex) return porDefecto
  const completo = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(completo.slice(i, i + 2), 16) / 255)
  const lineal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luz = 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b)
  // Demasiado claro para llevar texto blanco y para verse sobre la tarjeta.
  if (luz > 0.62) return porDefecto
  return { '--mq-acento': `#${completo}`, '--mq-sobre-acento': '#ffffff' }
}

// --- El estado del llamado ------------------------------------------------------

const CADA_CUANTO_MS = 5000
/** Cuanto queda a la vista el "ya te vieron". */
const ATENDIDO_VISIBLE_MS = 90_000

/**
 * El llamado de esta mesa. Mientras esta en curso se consulta cada 5 segundos
 * (solo con la pantalla a la vista) para saber cuando lo atendieron.
 */
export function useLlamadoDeMesa({ accountId, mesaId, activo }) {
  const [llamado, setLlamado] = useState(null)
  // Como se llama la mesa segun el local (el QR puede traer solo su identificador).
  const [mesaNombre, setMesaNombre] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [, setReloj] = useState(0)
  const guardadoEn = `capta:llamado-mesa:${accountId}:${mesaId}`
  const ruta = `/api/accounts/${encodeURIComponent(accountId || '')}/tables/${encodeURIComponent(mesaId || '')}/call`
  const idRef = useRef(null)

  const recordar = useCallback((id) => {
    idRef.current = id
    try {
      if (id) window.sessionStorage.setItem(guardadoEn, id)
      else window.sessionStorage.removeItem(guardadoEn)
    } catch {
      // sin almacenamiento: el estado igual se recupera por la mesa
    }
  }, [guardadoEn])

  const aplicar = useCallback((dato) => {
    const estado = dato?.estado
    if (dato?.mesa) setMesaNombre(String(dato.mesa))
    if (estado === 'llamando' || estado === 'atendido') {
      setLlamado((previo) => {
        // La primera vez que aparece "atendido": un toque en la mano.
        if (estado === 'atendido' && previo?.estado === 'llamando') {
          try { window.navigator.vibrate?.(140) } catch { /* sin vibracion */ }
        }
        return { ...dato, vistoAt: estado === 'atendido' ? (previo?.vistoAt || Date.now()) : null }
      })
      if (dato.id) recordar(dato.id)
    } else {
      setLlamado(null)
      recordar(null)
    }
  }, [recordar])

  const consultar = useCallback(async () => {
    if (!activo || !accountId || !mesaId) return
    try {
      const res = await fetch(`${ruta}${idRef.current ? `?id=${idRef.current}` : ''}`, { cache: 'no-store' })
      if (res.ok) aplicar(await res.json())
    } catch {
      // sin conexion un instante: se vuelve a intentar en la proxima vuelta
    }
  }, [activo, accountId, mesaId, ruta, aplicar])

  // Al entrar: si la mesa ya tenia un llamado en curso, se retoma.
  useEffect(() => {
    if (!activo) return
    try { idRef.current = window.sessionStorage.getItem(guardadoEn) } catch { idRef.current = null }
    const primera = window.setTimeout(() => { void consultar() }, 0)
    return () => window.clearTimeout(primera)
  }, [activo, guardadoEn, consultar])

  const estado = llamado?.estado || 'ninguno'
  useEffect(() => {
    if (!activo || estado !== 'llamando') return
    const vuelta = window.setInterval(() => {
      if (document.visibilityState === 'visible') void consultar()
    }, CADA_CUANTO_MS)
    const alVolver = () => { if (document.visibilityState === 'visible') void consultar() }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.clearInterval(vuelta)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [activo, estado, consultar])

  // El "ya te vieron" se va solo; y el "hace 2 min" se actualiza.
  const vistoAt = llamado?.vistoAt || null
  useEffect(() => {
    if (estado === 'ninguno') return
    const tic = window.setInterval(() => {
      setReloj((n) => n + 1)
      if (vistoAt && Date.now() - vistoAt > ATENDIDO_VISIBLE_MS) {
        setLlamado(null)
        recordar(null)
      }
    }, 15_000)
    return () => window.clearInterval(tic)
  }, [estado, vistoAt, recordar])

  const llamar = useCallback(async (motivo, nota) => {
    setEnviando(true)
    try {
      const res = await fetch(ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, nota }),
      })
      const dato = await res.json().catch(() => ({}))
      if (!res.ok) return { ok: false, error: dato?.error || 'No pudimos avisar. Probá de nuevo.' }
      aplicar(dato)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Sin conexión. Probá de nuevo.' }
    } finally {
      setEnviando(false)
    }
  }, [ruta, aplicar])

  const cancelar = useCallback(async () => {
    const id = idRef.current || llamado?.id
    setLlamado(null)
    recordar(null)
    if (!id) return
    try {
      await fetch(ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelar: true, id }),
      })
    } catch {
      // si no llego, el llamado se cierra solo del lado del local
    }
  }, [ruta, llamado?.id, recordar])

  const descartar = useCallback(() => {
    setLlamado(null)
    recordar(null)
  }, [recordar])

  return { llamado, estado, mesaNombre, enviando, llamar, cancelar, descartar }
}

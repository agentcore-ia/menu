// LLAMAR AL MOZO desde la mesa (QR): el estado del llamado, la hoja donde se
// confirma, el aviso mientras esta en curso y el boton que flota sobre el menu.
//
// El estado del llamado esta en src/llamadoDeMesa.js; el servidor es
// server/llamadosDeMesa.js y las reglas, shared/mesaQr.js.
import { useEffect, useState } from 'react'
import { haceCuanto } from '../shared/mesaQr.js'
import { HojaDeWifi, IconoWifi } from './WifiDeMesa.jsx'
import './mesa-qr.css'

// --- Iconos (dibujados aca: no dependen de que cargue una fuente) -----------

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Svg = ({ children, ...resto }) => <svg viewBox="0 0 24 24" aria-hidden="true" {...trazo} {...resto}>{children}</svg>

export const IconoCampana = () => (
  <Svg><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" /><path d="M10 19a2.2 2.2 0 0 0 4 0" /><path d="M12 3V2" /></Svg>
)
export const IconoMenu = () => (
  <Svg><path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z" /><path d="M9 9h6M9 12.5h6M9 16h3.5" /></Svg>
)
export const IconoCuenta = () => (
  <Svg><path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.6V3Z" /><path d="M9 8h6M9 12h6" /></Svg>
)
export const IconoTarjeta = () => (
  <Svg><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3.5" /></Svg>
)
export const IconoEstrella = () => (
  <Svg><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6Z" /></Svg>
)
export const IconoFlecha = (props) => <Svg {...props}><path d="m9 5 7 7-7 7" /></Svg>
export const IconoCheck = () => <Svg strokeWidth={2.4}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
export const IconoMesa = () => <Svg><path d="M4 8h16M6 8l-1.5 11M18 8l1.5 11M9 8v6h6V8" /></Svg>
export const IconoCorazon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" /></svg>
)
export const IconoInicio = () => <Svg><path d="M4 11.5 12 4l8 7.5" /><path d="M6.5 10v9.5h11V10" /></Svg>

// --- Textos ----------------------------------------------------------------------

/** "Mesa 3" -> "la Mesa 3"; "Barra" o "Tu mesa" quedan como estan. */
const conArticulo = (mesa) => (/^mesa(?= |\d)/i.test(String(mesa)) ? `la ${mesa}` : String(mesa || 'tu mesa').replace(/^Tu mesa$/, 'tu mesa'))

const TEXTOS = {
  mozo: {
    pregunta: '¿Llamamos al mozo?',
    detalle: (mesa) => `Le avisamos que lo necesitan en ${conArticulo(mesa)}.`,
    boton: 'Llamar al mozo',
    enCurso: 'Mozo avisado',
    sugerencias: ['Cubiertos', 'Servilletas', 'Hielo', 'Otra bebida', 'Limpiar la mesa'],
    unaSola: false,
  },
  cuenta: {
    pregunta: '¿Pedimos la cuenta?',
    detalle: (mesa) => `Le avisamos al mozo que traiga la cuenta a ${conArticulo(mesa)}.`,
    boton: 'Pedir la cuenta',
    enCurso: 'Cuenta pedida',
    sugerencias: ['Pago en efectivo', 'Pago con tarjeta', 'Pago por transferencia'],
    unaSola: true,
  },
}

// --- El aviso del llamado en curso ------------------------------------------------

export function AvisoDeLlamado({ llamada }) {
  const { llamado, estado, cancelar, descartar } = llamada
  if (estado === 'llamando') {
    return (
      <div className="mq-aviso" role="status" aria-live="polite">
        <span className="mq-latido"><IconoCampana /></span>
        <div className="mq-aviso-texto">
          <p className="mq-aviso-titulo">{TEXTOS[llamado.motivo]?.enCurso || TEXTOS.mozo.enCurso}</p>
          <p className="mq-aviso-detalle">Avisamos {haceCuanto(llamado.creado_at)} · en un momento se acercan</p>
        </div>
        <button type="button" className="mq-aviso-accion" onClick={() => void cancelar()}>Cancelar</button>
      </div>
    )
  }
  if (estado === 'atendido') {
    return (
      <div className="mq-aviso mq-atendido" role="status" aria-live="polite">
        <span className="mq-ok"><IconoCheck /></span>
        <div className="mq-aviso-texto">
          <p className="mq-aviso-titulo">¡Ya te vieron!</p>
          <p className="mq-aviso-detalle">En un momento se acercan a tu mesa</p>
        </div>
        <button type="button" className="mq-aviso-accion" onClick={descartar}>Listo</button>
      </div>
    )
  }
  return null
}

// --- La hoja --------------------------------------------------------------------

/**
 * `motivo` fijo ('mozo' | 'cuenta') abre directo la confirmacion. Sin motivo
 * (desde el boton que flota en el menu) primero se elige que hacer.
 */
export function HojaDeMesa({ abierta, motivo: motivoInicial = null, opciones, mesa, colores, llamada, onCerrar, onIrAlInicio, onWifi = null }) {
  const [motivo, setMotivo] = useState(motivoInicial)
  const [elegidas, setElegidas] = useState([])
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')
  const [recienEnviado, setRecienEnviado] = useState(false)
  const { estado, enviando, llamar, cancelar } = llamada

  useEffect(() => {
    if (!abierta) return undefined
    const escape = (e) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', escape)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', escape)
      document.body.style.overflow = antes
    }
  }, [abierta, onCerrar])

  if (!abierta) return null

  const textos = TEXTOS[motivo] || null
  const alternar = (texto) => {
    setElegidas((previas) => {
      if (textos?.unaSola) return previas.includes(texto) ? [] : [texto]
      return previas.includes(texto) ? previas.filter((t) => t !== texto) : [...previas, texto]
    })
  }
  const elegir = (cual) => { setMotivo(cual); setElegidas([]); setNota(''); setError('') }
  const enviar = async () => {
    setError('')
    const completa = [...elegidas, nota.trim()].filter(Boolean).join(' · ')
    const r = await llamar(motivo, completa)
    if (r.ok) setRecienEnviado(true)
    else setError(r.error)
  }

  let cuerpo
  if (recienEnviado) {
    cuerpo = (
      <div className="mq-hoja-centro">
        <div className="mq-enviado"><span className="mq-latido"><IconoCampana /></span></div>
        <h2 className="mq-hoja-titulo">¡Listo! Ya avisamos</h2>
        <p className="mq-hoja-detalle">En un momento se acercan a {conArticulo(mesa)}. Podés seguir mirando el menú.</p>
        <button type="button" className="mq-boton" onClick={onCerrar}>Entendido</button>
      </div>
    )
  } else if (estado === 'llamando' && !motivoInicial && !motivo) {
    // Desde el boton flotante, con un llamado ya en curso.
    cuerpo = (
      <div className="mq-hoja-centro">
        <div className="mq-enviado"><span className="mq-latido"><IconoCampana /></span></div>
        <h2 className="mq-hoja-titulo">{TEXTOS[llamada.llamado?.motivo]?.enCurso || 'Mozo avisado'}</h2>
        <p className="mq-hoja-detalle">Avisamos {haceCuanto(llamada.llamado?.creado_at)}. En un momento se acercan a {conArticulo(mesa)}.</p>
        <button type="button" className="mq-boton" onClick={onCerrar}>Entendido</button>
        <button type="button" className="mq-boton-suave" onClick={() => { void cancelar(); onCerrar() }}>Cancelar el llamado</button>
      </div>
    )
  } else if (!textos) {
    cuerpo = (
      <div className="mq-hoja-centro">
        <h2 className="mq-hoja-titulo" style={{ marginTop: 4 }}>{mesa}</h2>
        <p className="mq-hoja-detalle">¿Qué necesitás?</p>
        <div className="mq-opciones">
          {opciones.llamarMozo ? (
            <button type="button" className="mq-accion" onClick={() => elegir('mozo')}>
              <span className="mq-accion-icono"><IconoCampana /></span>
              <span className="mq-accion-texto">
                <span className="mq-accion-titulo">Llamar al mozo</span>
                <span className="mq-accion-detalle">Le avisamos que se acerque</span>
              </span>
              <IconoFlecha className="mq-accion-flecha" />
            </button>
          ) : null}
          {opciones.pedirCuenta ? (
            <button type="button" className="mq-accion" onClick={() => elegir('cuenta')}>
              <span className="mq-accion-icono"><IconoCuenta /></span>
              <span className="mq-accion-texto">
                <span className="mq-accion-titulo">Pedir la cuenta</span>
                <span className="mq-accion-detalle">El mozo la lleva a tu mesa</span>
              </span>
              <IconoFlecha className="mq-accion-flecha" />
            </button>
          ) : null}
          {opciones.wifi && onWifi ? (
            <button type="button" className="mq-accion" onClick={onWifi}>
              <span className="mq-accion-icono"><IconoWifi /></span>
              <span className="mq-accion-texto">
                <span className="mq-accion-titulo">Wi-Fi</span>
                <span className="mq-accion-detalle">Conectate a la red del local</span>
              </span>
              <IconoFlecha className="mq-accion-flecha" />
            </button>
          ) : null}
          {onIrAlInicio ? (
            <button type="button" className="mq-accion" onClick={onIrAlInicio}>
              <span className="mq-accion-icono"><IconoInicio /></span>
              <span className="mq-accion-texto">
                <span className="mq-accion-titulo">Volver al inicio</span>
                <span className="mq-accion-detalle">Pagar, dejar una reseña y más</span>
              </span>
              <IconoFlecha className="mq-accion-flecha" />
            </button>
          ) : null}
        </div>
        <button type="button" className="mq-boton-suave" onClick={onCerrar}>Cerrar</button>
      </div>
    )
  } else {
    cuerpo = (
      <div className="mq-hoja-centro">
        <span className="mq-hoja-icono">{motivo === 'cuenta' ? <IconoCuenta /> : <IconoCampana />}</span>
        <h2 className="mq-hoja-titulo">{textos.pregunta}</h2>
        <p className="mq-hoja-detalle">{textos.detalle(mesa)}</p>
        <div className="mq-pastillas">
          {textos.sugerencias.map((texto) => (
            <button
              key={texto}
              type="button"
              className={`mq-pastilla${elegidas.includes(texto) ? ' mq-elegida' : ''}`}
              aria-pressed={elegidas.includes(texto)}
              onClick={() => alternar(texto)}
            >
              {texto}
            </button>
          ))}
        </div>
        <input
          className="mq-nota"
          type="text"
          value={nota}
          maxLength={80}
          placeholder="Agregar un comentario (opcional)"
          aria-label="Comentario para el mozo"
          onChange={(e) => setNota(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !enviando) void enviar() }}
        />
        {error ? <p className="mq-error" role="alert">{error}</p> : null}
        <button type="button" className="mq-boton" disabled={enviando} onClick={() => void enviar()}>
          {enviando ? 'Avisando…' : textos.boton}
        </button>
        <button type="button" className="mq-boton-suave" onClick={onCerrar}>Ahora no</button>
      </div>
    )
  }

  return (
    <div className="mq-velo" onClick={onCerrar}>
      <div className="mq-hoja" style={colores} role="dialog" aria-modal="true" aria-label={textos?.pregunta || mesa} onClick={(e) => e.stopPropagation()}>
        <div className="mq-manija" />
        {cuerpo}
      </div>
    </div>
  )
}

// --- El boton que flota sobre el menu -------------------------------------------

export function MozoFlotante({ accountId, mesaId, opciones, mesa, colores, llamada, onIrAlInicio }) {
  const [abierta, setAbierta] = useState(false)
  const [wifiAbierto, setWifiAbierto] = useState(false)
  // La hoja se arma de nuevo en cada apertura: asi arranca siempre limpia.
  const [vuelta, setVuelta] = useState(0)
  const puedeLlamar = opciones.llamarMozo || opciones.pedirCuenta
  if (!puedeLlamar && !onIrAlInicio) return null

  const { estado } = llamada
  const clase = `mq-flotante${estado === 'llamando' ? ' mq-llamando' : ''}${estado === 'atendido' ? ' mq-listo' : ''}`
  const etiqueta = estado === 'llamando' ? 'Avisado' : estado === 'atendido' ? '¡Ya te vieron!' : puedeLlamar ? 'Mozo' : mesa

  return (
    <>
      <button
        type="button"
        className={clase}
        style={colores}
        aria-label={puedeLlamar ? 'Llamar al mozo' : 'Opciones de la mesa'}
        onClick={() => { setVuelta((n) => n + 1); setAbierta(true) }}
      >
        {estado === 'atendido' ? <IconoCheck /> : puedeLlamar ? <IconoCampana /> : <IconoMesa />}
        <span>{etiqueta}</span>
      </button>
      <HojaDeMesa
        key={vuelta}
        abierta={abierta}
        opciones={opciones}
        mesa={mesa}
        colores={colores}
        llamada={llamada}
        onCerrar={() => setAbierta(false)}
        onIrAlInicio={onIrAlInicio ? () => { setAbierta(false); onIrAlInicio() } : null}
        onWifi={() => { setAbierta(false); setWifiAbierto(true) }}
      />
      <HojaDeWifi abierta={wifiAbierto} accountId={accountId} mesaId={mesaId} colores={colores} onCerrar={() => setWifiAbierto(false)} />
    </>
  )
}

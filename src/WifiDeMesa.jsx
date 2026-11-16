// EL WI-FI DEL LOCAL, desde la mesa (QR): el nombre de la red, la contraseña para
// copiar y un codigo para que otro celular se conecte con la camara.
//
// Un navegador no puede conectar el telefono a una red por su cuenta: lo mas
// corto que existe es copiar la contraseña y, para el de al lado, escanear el
// codigo. Los datos se piden recien al abrir (server/llamadosDeMesa.js): no
// viajan con el menu.
import { useEffect, useState } from 'react'
import { textoQrDelWifi } from '../shared/mesaQr.js'
import './mesa-qr.css'

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IconoWifi = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trazo}>
    <path d="M2.5 9.5a14 14 0 0 1 19 0" />
    <path d="M5.8 13a9.3 9.3 0 0 1 12.4 0" />
    <path d="M9 16.4a4.6 4.6 0 0 1 6 0" />
    <circle cx="12" cy="19.4" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)
const IconoCopiar = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trazo}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
  </svg>
)
const IconoListo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trazo} strokeWidth={2.4}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)

/** Copia al portapapeles; con el metodo viejo si el navegador no deja usar el nuevo. */
async function copiar(texto) {
  try {
    if (window.navigator.clipboard?.writeText) {
      await window.navigator.clipboard.writeText(texto)
      return true
    }
  } catch {
    // sigue con el metodo viejo
  }
  try {
    const campo = document.createElement('textarea')
    campo.value = texto
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(campo)
    return ok
  } catch {
    return false
  }
}

/** El codigo QR dibujado aca mismo: la contraseña no sale del telefono hacia ningun servicio. */
function CodigoQr({ texto }) {
  const [modulos, setModulos] = useState(null)
  useEffect(() => {
    let vivo = true
    import('qrcode-generator')
      .then(({ default: qrcode }) => {
        const qr = qrcode(0, 'M')
        qr.addData(texto, 'Byte')
        qr.make()
        const lado = qr.getModuleCount()
        let trazado = ''
        for (let fila = 0; fila < lado; fila++) {
          for (let columna = 0; columna < lado; columna++) {
            if (qr.isDark(fila, columna)) trazado += `M${columna} ${fila}h1v1h-1z`
          }
        }
        if (vivo) setModulos({ lado, trazado })
      })
      .catch(() => { if (vivo) setModulos(false) })
    return () => { vivo = false }
  }, [texto])

  if (modulos === false) return null
  return (
    <div className="mq-qr">
      {modulos ? (
        <svg viewBox={`-2 -2 ${modulos.lado + 4} ${modulos.lado + 4}`} role="img" aria-label="Código QR para conectarse al Wi-Fi" shapeRendering="crispEdges">
          <rect x="-2" y="-2" width={modulos.lado + 4} height={modulos.lado + 4} fill="#fff" />
          <path d={modulos.trazado} fill="#111" />
        </svg>
      ) : (
        <span className="mq-qr-cargando" />
      )}
    </div>
  )
}

export function HojaDeWifi({ abierta, accountId, mesaId, colores, onCerrar }) {
  // undefined: cargando · null: no se pudo · objeto: los datos
  const [wifi, setWifi] = useState(undefined)
  const [copiado, setCopiado] = useState('')

  useEffect(() => {
    if (!abierta) return undefined
    let vivo = true
    fetch(`/api/accounts/${encodeURIComponent(accountId || '')}/tables/${encodeURIComponent(mesaId || '')}/wifi`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((dato) => { if (vivo) setWifi(dato?.red ? dato : null) })
      .catch(() => { if (vivo) setWifi(null) })
    const escape = (e) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', escape)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      vivo = false
      document.removeEventListener('keydown', escape)
      document.body.style.overflow = antes
    }
  }, [abierta, accountId, mesaId, onCerrar])

  if (!abierta) return null

  const alCopiar = async (que, texto) => {
    if (await copiar(texto)) {
      setCopiado(que)
      window.setTimeout(() => setCopiado((actual) => (actual === que ? '' : actual)), 2200)
    } else {
      // El navegador no dejo copiar: que sepa que puede hacerlo a mano.
      setCopiado('fallo')
    }
  }

  let cuerpo
  if (wifi === undefined) {
    cuerpo = (
      <div className="mq-hoja-centro">
        <span className="mq-hoja-icono"><IconoWifi /></span>
        <h2 className="mq-hoja-titulo">Wi-Fi</h2>
        <p className="mq-hoja-detalle">Buscando los datos de la red…</p>
      </div>
    )
  } else if (!wifi) {
    cuerpo = (
      <div className="mq-hoja-centro">
        <span className="mq-hoja-icono"><IconoWifi /></span>
        <h2 className="mq-hoja-titulo">Wi-Fi</h2>
        <p className="mq-error" role="alert">No pudimos traer los datos de la red. Pedíselos a quien te atiende.</p>
        <button type="button" className="mq-boton" onClick={onCerrar}>Cerrar</button>
      </div>
    )
  } else {
    cuerpo = (
      <div className="mq-hoja-centro">
        <span className="mq-hoja-icono"><IconoWifi /></span>
        <h2 className="mq-hoja-titulo">Conectate al Wi-Fi</h2>
        <p className="mq-hoja-detalle">
          {wifi.abierta
            ? 'Es una red abierta: elegila en los ajustes de Wi-Fi de tu celular.'
            : 'Copiá la contraseña, abrí los ajustes de Wi-Fi de tu celular y elegí la red.'}
        </p>

        <div className="mq-wifi">
          <div className="mq-wifi-fila">
            <div className="mq-wifi-dato">
              <span className="mq-wifi-etiqueta">Red</span>
              <span className="mq-wifi-valor">{wifi.red}</span>
            </div>
            <button type="button" className="mq-wifi-copiar" onClick={() => void alCopiar('red', wifi.red)} aria-label="Copiar el nombre de la red">
              {copiado === 'red' ? <IconoListo /> : <IconoCopiar />}
            </button>
          </div>
          <div className="mq-wifi-fila">
            <div className="mq-wifi-dato">
              <span className="mq-wifi-etiqueta">Contraseña</span>
              {wifi.abierta
                ? <span className="mq-wifi-valor mq-wifi-suave">No hace falta</span>
                : <span className="mq-wifi-valor mq-wifi-clave">{wifi.clave}</span>}
            </div>
          </div>
        </div>

        {wifi.abierta ? null : (
          <button type="button" className="mq-boton" onClick={() => void alCopiar('clave', wifi.clave)}>
            {copiado === 'clave' ? '¡Contraseña copiada!' : 'Copiar la contraseña'}
          </button>
        )}
        {copiado === 'fallo' ? (
          <p className="mq-hoja-detalle" role="status">No se pudo copiar sola: mantené apretada la contraseña y elegí «Copiar».</p>
        ) : null}

        <div className="mq-wifi-qr">
          <CodigoQr texto={textoQrDelWifi(wifi)} />
          <p>
            <strong>¿Otro celular en la mesa?</strong>
            Que apunte la cámara a este código y se conecta solo.
          </p>
        </div>

        <button type="button" className="mq-boton-suave" onClick={onCerrar}>Listo</button>
      </div>
    )
  }

  return (
    <div className="mq-velo" onClick={onCerrar}>
      <div className="mq-hoja" style={colores} role="dialog" aria-modal="true" aria-label="Wi-Fi del local" onClick={(e) => e.stopPropagation()}>
        <div className="mq-manija" />
        {cuerpo}
      </div>
    </div>
  )
}

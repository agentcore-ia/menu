// LA PANTALLA DE INICIO DE LA MESA: lo que ve el cliente al escanear el QR.
//
// Que botones aparecen lo decide el local en el panel (Ajustes > Experiencia QR
// en Mesa): llega en `opciones` (shared/mesaQr.js). El color es el del local.
import { useState } from 'react'
import { nombreDeMesa } from '../shared/mesaQr.js'
import {
  AvisoDeLlamado, HojaDeMesa, IconoCampana, IconoCorazon, IconoCuenta, IconoEstrella, IconoFlecha, IconoMenu,
  IconoMesa, IconoTarjeta,
} from './LlamarMozo.jsx'
import { HojaDeWifi, IconoWifi } from './WifiDeMesa.jsx'
import './mesa-qr.css'

function Accion({ icono, titulo, detalle, principal = false, activa = false, onClick }) {
  return (
    <button type="button" className={`mq-accion${principal ? ' mq-principal' : ''}${activa ? ' mq-activa' : ''}`} onClick={onClick}>
      <span className="mq-accion-icono">{icono}</span>
      <span className="mq-accion-texto">
        <span className="mq-accion-titulo">{titulo}</span>
        <span className="mq-accion-detalle">{detalle}</span>
      </span>
      <IconoFlecha className="mq-accion-flecha" />
    </button>
  )
}

export default function QRLanding({
  accountId,
  mesaId,
  restaurantName,
  logoUrl,
  welcomeText,
  qrBackgroundUrl,
  reviewGoogleUrl,
  opciones,
  colores,
  llamada,
  onVerMenu,
  onPagarCuenta,
  onDejarCalificacion,
}) {
  // Que se esta por pedir: 'mozo' | 'cuenta' | null (la hoja cerrada).
  const [hoja, setHoja] = useState(null)
  const [wifiAbierto, setWifiAbierto] = useState(false)
  const mesa = llamada.mesaNombre || nombreDeMesa(mesaId) || 'Tu mesa'
  const nombre = restaurantName || 'Bienvenidos'
  const motivoEnCurso = llamada.estado === 'llamando' ? llamada.llamado?.motivo : null

  const dejarResena = () => {
    if (reviewGoogleUrl) window.open(reviewGoogleUrl, '_blank', 'noopener,noreferrer')
    else onDejarCalificacion()
  }

  // El primer boton de la lista es el grande.
  const acciones = [
    opciones.verMenu && {
      clave: 'menu', icono: <IconoMenu />, titulo: 'Ver el menú', detalle: 'Mirá la carta y pedí desde tu mesa', onClick: onVerMenu,
    },
    opciones.llamarMozo && {
      clave: 'mozo', icono: <IconoCampana />, titulo: 'Llamar al mozo',
      detalle: motivoEnCurso === 'mozo' ? 'Ya avisamos · en un momento se acercan' : 'Le avisamos que se acerque a tu mesa',
      activa: motivoEnCurso === 'mozo', onClick: () => setHoja('mozo'),
    },
    opciones.pedirCuenta && {
      clave: 'cuenta', icono: <IconoCuenta />, titulo: 'Pedir la cuenta',
      detalle: motivoEnCurso === 'cuenta' ? 'Ya la pedimos · te la llevan a la mesa' : 'El mozo la lleva a tu mesa',
      activa: motivoEnCurso === 'cuenta', onClick: () => setHoja('cuenta'),
    },
    opciones.pagar && {
      clave: 'pagar', icono: <IconoTarjeta />, titulo: 'Pagar la cuenta', detalle: 'Revisá y pagá desde el celular', onClick: onPagarCuenta,
    },
    opciones.wifi && {
      clave: 'wifi', icono: <IconoWifi />, titulo: 'Wi-Fi', detalle: 'Conectate a la red del local', onClick: () => setWifiAbierto(true),
    },
    opciones.resena && {
      clave: 'resena', icono: <IconoEstrella />, titulo: 'Dejar una reseña', detalle: 'Contanos cómo estuvo todo', onClick: dejarResena,
    },
  ].filter(Boolean)

  return (
    <div className={`mq-pantalla${qrBackgroundUrl ? ' mq-con-foto' : ''}`} style={colores}>
      <div
        className={`mq-fondo${qrBackgroundUrl ? '' : ' mq-sin-foto'}`}
        style={qrBackgroundUrl ? { backgroundImage: `url(${JSON.stringify(String(qrBackgroundUrl))})` } : undefined}
      />

      <div className="mq-contenido">
        <header className="mq-cabecera">
          {logoUrl ? (
            <img className="mq-logo" src={logoUrl} alt={nombre} />
          ) : (
            <span className="mq-logo mq-logo-letra" aria-hidden="true">{nombre.trim().charAt(0).toUpperCase()}</span>
          )}
          <h1 className="mq-nombre">{nombre}</h1>
          <span className="mq-mesa"><IconoMesa />{mesa}</span>
          {opciones.bienvenida && String(welcomeText || '').trim() ? (
            <p className="mq-bienvenida">{String(welcomeText).trim()}</p>
          ) : null}
        </header>

        <AvisoDeLlamado llamada={llamada} />

        <nav className="mq-acciones" aria-label="Opciones de la mesa">
          {acciones.map(({ clave, ...accion }, indice) => (
            <Accion key={clave} principal={indice === 0} {...accion} />
          ))}
        </nav>

        <footer className="mq-pie">
          Conectado con <IconoCorazon /> capta
        </footer>
      </div>

      <HojaDeMesa
        key={hoja || 'cerrada'}
        abierta={Boolean(hoja)}
        motivo={hoja}
        opciones={opciones}
        mesa={mesa}
        colores={colores}
        llamada={llamada}
        onCerrar={() => setHoja(null)}
      />
      <HojaDeWifi abierta={wifiAbierto} accountId={accountId} mesaId={mesaId} colores={colores} onCerrar={() => setWifiAbierto(false)} />
    </div>
  )
}

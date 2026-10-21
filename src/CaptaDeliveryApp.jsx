// La vitrina de Capta Delivery: una sola pantalla con todos los locales que
// reparten con Capta, para que el cliente elija y entre a pedir.
//
// Lo que se muestra lo decide el servidor (/api/delivery/locales). Aca no hay
// ninguna lista de locales escrita a mano: si un local no viene en la respuesta,
// no existe para esta pantalla.
//
// Al elegir un local se va a SU menu de siempre (/slug), que es el que sabe
// cobrar, calcular el envio y mandar el pedido. Esta pantalla no hace pedidos:
// los reparte.

import MisPuntos from './MisPuntos.jsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIAS, ciudadPareja, GRUPOS, localCoincideCon } from '../shared/vitrinaCapta.js'
import { almacenDelNavegador, leerDatos, olvidarDatos } from '../shared/datosDelCliente.js'
import { celularValido, normalizarCelular } from '../shared/celular.js'
import { EntradaMandados, FormularioMandado } from './MandadoCapta.jsx'
import { leerEnCurso } from './mandadoEnCurso.js'
import { Ingresar, NombreDeLaCuenta } from './CuentaCapta.jsx'
import { borrarSesion, leerSesion, pedirCuenta, tomarBienvenida } from './sesionCapta.js'
import { leerUltimosPedidos, resumenDelPedido } from '../shared/volverAPedir.js'
import { coincideConElRubro, normalizarTexto, palabrasDeLaBusqueda } from '../shared/busquedaProductos.js'
import './CaptaDelivery.css'

const CLAVE_CIUDAD = 'capta-vitrina-ciudad'
const CLAVE_FAVORITOS = 'capta-vitrina-favoritos'
const CLAVE_CELULAR = 'capta-vitrina-celular'

/** El mismo muñeco del casco que usa el panel (public/capta/logo.svg), dibujado aca para que aparezca sin esperar una descarga. */
function LogoCapta({ tamano = 44, className = '' }) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Capta Delivery"
    >
      <defs>
        <linearGradient id="cd-fondo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a1a" />
          <stop offset="1" stopColor="#f4511e" />
        </linearGradient>
        <clipPath id="cd-marco">
          <rect width="120" height="120" rx="28" />
        </clipPath>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#cd-fondo)" />
      <g clipPath="url(#cd-marco)">
        <path d="M22 120 C22 82 40 62 64 62 C88 62 104 82 104 120 Z" fill="#ffb300" />
        <path d="M47 92 q5 -6 10 0" stroke="#1c1917" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M73 92 q5 -6 10 0" stroke="#1c1917" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M58 101 q7 6 14 0" stroke="#1c1917" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M30 74 C30 42 46 26 66 26 C88 26 102 44 102 72 L102 78 L30 78 Z" fill="#ffffff" />
        <rect x="28" y="72" width="76" height="9" rx="4.5" fill="#f3f0ea" />
        <path d="M78 43 A15 15 0 1 0 78 63" stroke="#f4511e" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
      <path d="M10 44 H24 M6 54 H22 M12 64 H24" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

function Icono({ nombre, relleno = false }) {
  return (
    <span
      className="material-symbols-outlined cd-icono"
      style={relleno ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {nombre}
    </span>
  )
}

/** "Hoy abre a las 17:00" no entra en una tarjeta: "Hoy abre 17:00" si. */
function cuandoAbre(texto) {
  return String(texto ?? '').replace(' a las ', ' ')
}

function pesos(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)
}

/** Lo que el cliente eligio la vez pasada, guardado en SU telefono. */
function leerPreferencia(clave, porDefecto = null) {
  try {
    const valor = almacenDelNavegador()?.getItem(clave)
    return valor === null || valor === undefined ? porDefecto : JSON.parse(valor)
  } catch {
    return porDefecto
  }
}

function guardarPreferencia(clave, valor) {
  try {
    almacenDelNavegador()?.setItem(clave, JSON.stringify(valor))
  } catch {
    // Sin localStorage (Safari en privado) la pantalla funciona igual, solo que
    // no recuerda la ciudad ni los favoritos.
  }
}

function useVitrina() {
  const [estado, setEstado] = useState({ cargando: true, error: '', locales: [], ciudades: [] })
  // Sube de a uno cuando el cliente toca "Reintentar": es lo que vuelve a
  // disparar la carga sin tener que tocar el estado dentro del efecto.
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true

    fetch('/api/delivery/locales')
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('No se pudo cargar')
        return respuesta.json()
      })
      .then((datos) => {
        if (!vivo) return
        setEstado({
          cargando: false,
          error: '',
          locales: Array.isArray(datos?.locales) ? datos.locales : [],
          ciudades: Array.isArray(datos?.ciudades) ? datos.ciudades : [],
        })
      })
      .catch(() => {
        if (!vivo) return
        setEstado({
          cargando: false,
          error: 'No pudimos cargar los locales. Fijate la conexión y volvé a intentar.',
          locales: [],
          ciudades: [],
        })
      })

    return () => {
      vivo = false
    }
  }, [intento])

  const recargar = useCallback(() => {
    setEstado((previo) => ({ ...previo, cargando: true, error: '' }))
    setIntento((n) => n + 1)
  }, [])

  return { ...estado, recargar }
}

/**
 * Las ciudades donde Capta hace mandados (las prende Capta desde su panel).
 * Va aparte de la lista de locales: si falla, la vitrina se ve igual, sin la
 * entrada de mandados.
 */
function useMandados() {
  const [ciudades, setCiudades] = useState([])

  useEffect(() => {
    let vivo = true
    fetch('/api/delivery/mandados?accion=ciudades')
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos) => {
        if (vivo && Array.isArray(datos?.ciudades)) setCiudades(datos.ciudades)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  return ciudades
}

/**
 * La foto de la tarjeta.
 *
 * Si el local no tiene foto (o la que tiene no carga), queda un fondo con su
 * color de marca y la inicial: nunca un cuadro roto.
 */
function Portada({ local }) {
  const [fallo, setFallo] = useState(false)
  const inicial = String(local.nombre || '?').trim().charAt(0).toUpperCase()

  if (!local.portada || fallo) {
    return (
      <div
        className="cd-portada cd-portada-sin-foto"
        style={{ '--cd-marca': local.color || '#f97316' }}
        aria-hidden="true"
      >
        <span>{inicial}</span>
      </div>
    )
  }

  return (
    <img
      className="cd-portada"
      src={local.portada}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFallo(true)}
    />
  )
}

function LogoLocal({ local }) {
  const [fallo, setFallo] = useState(false)
  const inicial = String(local.nombre || '?').trim().charAt(0).toUpperCase()

  if (!local.logo || fallo) {
    return (
      <span className="cd-logo-local cd-logo-inicial" style={{ background: local.color || '#f97316' }}>
        {inicial}
      </span>
    )
  }

  return (
    <span className="cd-logo-local">
      <img src={local.logo} alt="" loading="lazy" onError={() => setFallo(true)} />
    </span>
  )
}

/** El logo chico de las tiras horizontales (no va encima de una foto). */
function MiniLogo({ local }) {
  const [fallo, setFallo] = useState(false)
  const inicial = String(local.nombre || '?').trim().charAt(0).toUpperCase()
  return (
    <span className="cd-mini-logo" style={{ background: local.logo && !fallo ? '#fff' : local.color || '#f97316' }}>
      {local.logo && !fallo ? <img src={local.logo} alt="" loading="lazy" onError={() => setFallo(true)} /> : inicial}
    </span>
  )
}

/** Que puede hacer ahora con ese local, en pocas palabras. */
function estadoCorto(local) {
  if (local.abierto) return local.tiempo ? `Abierto · ${local.tiempo}` : 'Abierto'
  if (local.programable) return 'Cerrado · podés programar'
  return cuandoAbre(local.proximaApertura) || 'Cerrado ahora'
}

/**
 * "Volver a pedir": el ultimo pedido de cada local, guardado en este telefono
 * (shared/volverAPedir.js). Un toque abre el menu con el carrito ya armado,
 * con los precios de hoy.
 */
function VolverAPedir({ pedidos }) {
  return (
    <section className="cd-tira" aria-label="Volver a pedir">
      <div className="cd-titulo-seccion">
        <h2>Volver a pedir</h2>
      </div>
      <div className="cd-carrusel">
        {pedidos.map(({ pedido, local }) => (
          <a
            key={local.slug}
            className="cd-repetir"
            href={`/${encodeURIComponent(local.slug)}?vitrina=1&repetir=1`}
          >
            <MiniLogo local={local} />
            <span className="cd-repetir-textos">
              <strong>{local.nombre}</strong>
              <small>{resumenDelPedido(pedido)}</small>
              <em>{local.abierto ? 'Repetir pedido' : local.programable ? 'Programarlo de nuevo' : estadoCorto(local)}</em>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

/** El dibujo de la derecha del cupon: moto de reparto, porcentaje o pesos. */
function DibujoCupon({ tipo }) {
  const trazo = { fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (tipo === 'envio_gratis') {
    return (
      <svg className="cd-cupon-dibujo" viewBox="0 0 76 60" aria-hidden="true">
        <path d="M3 22h13M0 31h15M6 40h10" {...trazo} strokeWidth="2.6" />
        <rect x="24" y="10" width="19" height="15" rx="3.5" fill="#fff" />
        <circle cx="53" cy="9" r="4.6" fill="#fff" />
        <path d="M52 15 47 31M52 17l9 7" {...trazo} />
        <path d="M31 47h19l4-9" {...trazo} />
        <path d="M46 31l-8 16M57 24l6 22" {...trazo} />
        <circle cx="27" cy="48" r="7" {...trazo} />
        <circle cx="64" cy="48" r="7" {...trazo} />
      </svg>
    )
  }
  if (tipo === 'monto') {
    return (
      <svg className="cd-cupon-dibujo" viewBox="0 0 76 60" aria-hidden="true">
        <path d="M44 6l4 9M54 3l-1 10M63 8l-6 8" {...trazo} strokeWidth="2.6" />
        <text x="22" y="52" fill="#fff" fontSize="52" fontWeight="800" fontFamily="Manrope, system-ui, sans-serif">$</text>
      </svg>
    )
  }
  return (
    <svg className="cd-cupon-dibujo" viewBox="0 0 76 60" aria-hidden="true">
      <path d="M44 6l4 9M54 3l-1 10M63 8l-6 8" {...trazo} strokeWidth="2.6" />
      <circle cx="31" cy="22" r="7.5" {...trazo} strokeWidth="5.5" />
      <circle cx="58" cy="47" r="7.5" {...trazo} strokeWidth="5.5" />
      <path d="M62 15 27 54" {...trazo} strokeWidth="5.5" />
    </svg>
  )
}

const quitarAcentos = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/**
 * Los cupones de Capta (los crea el admin): los de la cuenta primero, despues
 * las ofertas a la vista. Tocar uno copia el codigo para usarlo al pedir.
 *
 * Tarjeta con forma de ticket: etiqueta arriba, el beneficio grande con su
 * dibujo, y abajo el codigo con el boton de copiar. Las muescas a los costados
 * son parte del diseno (ver .cd-cupon en el css).
 */
function OfertasParaVos({ cupones, onCopiar }) {
  const lista = [
    ...cupones.billetera.map((c) => ({ ...c, propio: true })),
    ...cupones.ofertas.filter((o) => !cupones.billetera.some((b) => b.codigo === o.codigo)),
  ]
  if (!lista.length) return null

  return (
    <section className="cd-tira" aria-label="Ofertas para vos">
      <div className="cd-titulo-seccion">
        <h2>Ofertas para vos</h2>
      </div>
      <div className="cd-carrusel cd-carrusel-cupones">
        {lista.map((c) => {
          // El titulo se muestra solo si dice algo mas que el cartel grande.
          const subtitulo = quitarAcentos(c.titulo) !== quitarAcentos(c.texto) ? c.titulo : ''
          return (
            <button
              key={c.codigo}
              type="button"
              className="cd-cupon"
              style={{ '--cd-marca': c.color || '#16a34a' }}
              onClick={() => onCopiar(c)}
            >
              <em className="cd-cupon-tag">{c.propio ? 'Tuyo' : c.tipo === 'envio_gratis' ? 'Envío' : 'Descuento'}</em>
              <span className="cd-cupon-cuerpo">
                <span className="cd-cupon-texto">
                  <strong>{c.texto}</strong>
                  {subtitulo ? <small>{subtitulo}</small> : null}
                  <i>
                    {c.minimoCompra > 0 ? `Compra mínima $${c.minimoCompra.toLocaleString('es-AR')} · ` : ''}
                    {c.hasta ? `Hasta el ${new Date(c.hasta).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}` : 'Sin vencimiento'}
                  </i>
                </span>
                <DibujoCupon tipo={c.tipo} />
              </span>
              <span className="cd-cupon-codigo">
                <b>{c.codigo}</b>
                <u>
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="11" height="11" rx="2.5" />
                    <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
                  </svg>
                  Copiar
                </u>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/** Las promos de los locales de la ciudad (las carga Capta desde su panel). */
function PromosDeHoy({ locales }) {
  return (
    <section className="cd-tira" aria-label="Promos de hoy">
      <div className="cd-titulo-seccion">
        <h2>Promos de hoy</h2>
      </div>
      <div className="cd-carrusel">
        {locales.map((local) => (
          <a
            key={local.slug}
            className={`cd-promo ${local.abierto || local.programable ? '' : 'cd-promo-cerrada'}`}
            href={`/${encodeURIComponent(local.slug)}?vitrina=1`}
            style={{ '--cd-marca': local.color || '#f4511e' }}
          >
            <span className="cd-promo-icono">
              <Icono nombre="local_offer" relleno />
            </span>
            <strong>{local.promo}</strong>
            <span className="cd-promo-pie">
              <MiniLogo local={local} />
              <span>
                <b>{local.nombre}</b>
                <small>{estadoCorto(local)}</small>
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

function Hoja({ titulo, children, onCerrar, clase = '' }) {
  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  return (
    <div className="cd-hoja-fondo" role="dialog" aria-modal="true" aria-label={titulo} onClick={onCerrar}>
      <div className={`cd-hoja ${clase}`.trim()} onClick={(evento) => evento.stopPropagation()}>
        <div className="cd-hoja-barra">
          <h2>{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Lo que este telefono tiene guardado del cliente (su libreta, no una base nuestra). */
function MisDatos({ onCerrar }) {
  const [datos, setDatos] = useState(() => leerDatos(almacenDelNavegador()))

  const borrar = () => {
    olvidarDatos(almacenDelNavegador())
    setDatos(null)
  }

  return (
    <Hoja titulo="Mis datos" onCerrar={onCerrar}>
      {datos ? (
        <>
          <p className="cd-hoja-texto">
            Esto quedó guardado en este teléfono para no tener que escribirlo en cada pedido. No sale de acá.
          </p>
          <dl className="cd-datos">
            {datos.name ? (
              <div>
                <dt>Nombre</dt>
                <dd>{datos.name}</dd>
              </div>
            ) : null}
            {datos.phone ? (
              <div>
                <dt>Celular</dt>
                <dd>{datos.phone}</dd>
              </div>
            ) : null}
            {datos.address ? (
              <div>
                <dt>Dirección</dt>
                <dd>{datos.address}</dd>
              </div>
            ) : null}
            {datos.neighborhood ? (
              <div>
                <dt>Barrio</dt>
                <dd>{datos.neighborhood}</dd>
              </div>
            ) : null}
          </dl>
          <button type="button" className="cd-boton-borrar" onClick={borrar}>
            Borrar mis datos de este teléfono
          </button>
        </>
      ) : (
        <p className="cd-hoja-texto">
          Todavía no hay nada guardado. Cuando hagas un pedido, tus datos quedan en este teléfono para la próxima.
        </p>
      )}
    </Hoja>
  )
}

/**
 * El banner de arriba de todo.
 *
 * Hay una imagen hecha por ciudad (public/capta/banner-<ciudad>.png|webp) con
 * el nombre de la ciudad impreso. La ciudad que no tiene la suya muestra el
 * banner dibujado, que arma el nombre solo: asi no puede pasar que a alguien de
 * otra ciudad le diga "CHIVILCOY".
 *
 * Para sumar una ciudad alcanza con dejar el archivo con su nombre.
 */
function Banner({ ciudad }) {
  const clave = ciudadPareja(ciudad).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const [sinImagen, setSinImagen] = useState(false)

  if (clave && !sinImagen) {
    return (
      <section className="cd-banner cd-banner-imagen">
        <picture>
          <source srcSet={`/capta/banner-${clave}.webp?v=2`} type="image/webp" />
          <img
            src={`/capta/banner-${clave}.png?v=2`}
            alt={`Capta Delivery en ${ciudad}: tus sabores favoritos, mas cerca`}
            onError={() => setSinImagen(true)}
          />
        </picture>
      </section>
    )
  }

  return (
    <section className="cd-banner">
      <div>
        <p className="cd-banner-kicker">{(ciudad || 'Tu ciudad').toUpperCase()}</p>
        <h1>
          Tus sabores favoritos,
          <br />
          <em>más cerca</em>
        </h1>
        <p className="cd-banner-texto">Apoyá lo de tu ciudad, pedí por Capta.</p>
      </div>
      <LogoCapta tamano={104} className="cd-banner-logo" />
    </section>
  )
}

/** "Mis puntos": la pantalla vive en MisPuntos.jsx; aca se le pasan las herramientas de la vitrina. */
function MisPuntosHoja({ onCerrar }) {
  const [celularInicial] = useState(() => {
    const guardado = leerPreferencia(CLAVE_CELULAR, '')
    if (typeof guardado === 'string' && guardado) return guardado
    // Si ya hizo un pedido desde este telefono, el numero ya lo tenemos.
    const datos = leerDatos(almacenDelNavegador())
    return datos?.phone ? String(datos.phone) : ''
  })

  return (
    <MisPuntos
      onCerrar={onCerrar}
      pesos={pesos}
      celularInicial={celularInicial}
      celularValido={celularValido}
      normalizarCelular={normalizarCelular}
      alGuardarCelular={(numero) => guardarPreferencia(CLAVE_CELULAR, numero)}
    />
  )
}

/** Los iconos de la barra de abajo, dibujados como en el diseño (trazo fino). */
function IconoBarra({ nombre, activo }) {
  const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (nombre === 'inicio') {
    return activo ? (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path d="M3.6 10.4 12 3.5l8.4 6.9V20a1 1 0 0 1-1 1h-4.6v-6.2H9.2V21H4.6a1 1 0 0 1-1-1z" fill="currentColor" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path d="M3.6 10.4 12 3.5l8.4 6.9V20a1 1 0 0 1-1 1h-4.6v-6.2H9.2V21H4.6a1 1 0 0 1-1-1z" {...trazo} />
      </svg>
    )
  }
  if (nombre === 'pedidos') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <rect x="5.5" y="3" width="13" height="18" rx="3" {...trazo} fill={activo ? 'currentColor' : 'none'} />
        <path d="M9 3.2v1.3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3.2" {...trazo} stroke={activo ? '#fff' : 'currentColor'} />
      </svg>
    )
  }
  if (nombre === 'guardados') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.6L5.5 21V4.5a1 1 0 0 1 1-1z" {...trazo} fill={activo ? 'currentColor' : 'none'} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <circle cx="12" cy="8" r="4.2" {...trazo} fill={activo ? 'currentColor' : 'none'} />
      <path d="M4 20.5c.9-4 4.1-6.2 8-6.2s7.1 2.2 8 6.2" {...trazo} fill={activo ? 'currentColor' : 'none'} />
    </svg>
  )
}

function BarraInferior({ vista, onVista, onPuntos, guardados, puntosAbierto = false }) {
  const items = [
    { id: 'inicio', texto: 'Inicio' },
    { id: 'pedidos', texto: 'Pedidos' },
    { id: 'puntos', texto: 'Mis puntos' },
    { id: 'guardados', texto: 'Guardados', globo: guardados || 0 },
    { id: 'perfil', texto: 'Perfil' },
  ]
  // "Ver todos" y los cuadrados de categorias siguen siendo parte del inicio.
  const activa = puntosAbierto ? 'puntos' : ['todos', 'grupo'].includes(vista) ? 'inicio' : vista

  return (
    <nav className="cd-barra-inferior" aria-label="Secciones">
      {items.map((item) =>
        item.id === 'puntos' ? (
          <button key={item.id} type="button" className="cd-nav-puntos" onClick={onPuntos} aria-current={puntosAbierto ? 'page' : undefined}>
            <svg className="cd-nav-bulto" viewBox="0 0 156 31" aria-hidden="true"><path d="M0,30 C18,30 26,27 36,19 C47,10 60,2 78,2 C96,2 109,10 120,19 C130,27 138,30 156,30 L156,31 L0,31 Z" fill="#fff" /></svg>
            <span className="cd-nav-icono"><span className="cd-nav-puntos-boton"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.4" y="8.3" width="17.2" height="3.4" rx="1.4" />
              <path d="M5.2 11.7v7.2a2.1 2.1 0 0 0 2.1 2.1h9.4a2.1 2.1 0 0 0 2.1-2.1v-7.2" />
              <path d="M12 8.3V21" />
              <path d="M12 8.3C9.6 8.3 7.2 7.5 7.2 5.8 7.2 4.5 8.4 3.8 9.6 4.1 11.1 4.5 12 6.3 12 8.3Z" />
              <path d="M12 8.3c2.4 0 4.8-.8 4.8-2.5 0-1.3-1.2-2-2.4-1.7C12.9 4.5 12 6.3 12 8.3Z" />
            </svg></span></span>
            <span>{item.texto}</span>
          </button>
        ) : (
        <button
          key={item.id}
          type="button"
          className={activa === item.id ? 'cd-nav-activo' : ''}
          aria-current={activa === item.id ? 'page' : undefined}
          onClick={() => onVista(item.id)}
        >
          <span className="cd-nav-icono">
            <IconoBarra nombre={item.id} activo={activa === item.id} />
            {item.globo ? <span className="cd-globo">{item.globo}</span> : null}
          </span>
          {item.texto}
        </button>
        ),
      )}
    </nav>
  )
}

/** "Chivilcoy" -> "chivilcoy": el nombre de los archivos de cada ciudad. */
function claveDeCiudad(ciudad) {
  return ciudadPareja(ciudad).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * El carrusel de arriba. Cada ciudad puede tener su foto principal
 * (public/capta/hero-<ciudad>.webp) y su banner (banner-<ciudad>.webp); despues
 * van las promos del dia. Una imagen que no existe se saca sola; si no queda
 * ninguna, se dibuja el banner con el nombre de la ciudad.
 */
function Carrusel({ ciudad, promos }) {
  const clave = claveDeCiudad(ciudad)
  const [rotas, setRotas] = useState([])
  const [actual, setActual] = useState(0)
  const pistaRef = useRef(null)
  const tocandoRef = useRef(false)

  const slides = useMemo(() => {
    const lista = []
    if (clave) {
      lista.push({ id: `hero-${clave}`, tipo: 'imagen', src: `/capta/hero-${clave}.webp?v=2` })
      lista.push({ id: `banner-${clave}`, tipo: 'imagen', src: `/capta/banner-${clave}.webp?v=2` })
    }
    for (const local of promos.slice(0, 3)) lista.push({ id: `promo-${local.slug}`, tipo: 'promo', local })
    const sanas = lista.filter((s) => !rotas.includes(s.id))
    return sanas.some((s) => s.tipo === 'imagen') ? sanas : [{ id: 'dibujado', tipo: 'dibujado' }, ...sanas]
  }, [clave, promos, rotas])

  const total = slides.length

  // Pasa solo cada 5 segundos, salvo que el cliente lo este moviendo.
  useEffect(() => {
    if (total < 2) return undefined
    const intervalo = window.setInterval(() => {
      const pista = pistaRef.current
      if (!pista || tocandoRef.current) return
      const siguiente = (Math.round(pista.scrollLeft / pista.clientWidth) + 1) % total
      pista.scrollTo({ left: siguiente * pista.clientWidth, behavior: 'smooth' })
    }, 5000)
    return () => window.clearInterval(intervalo)
  }, [total])

  const alMover = () => {
    const pista = pistaRef.current
    if (pista) setActual(Math.min(total - 1, Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth))))
  }

  return (
    <section className="cd-carrusel-hero" aria-label="Novedades">
      <div
        className="cd-carrusel-pista"
        ref={pistaRef}
        onScroll={alMover}
        onPointerDown={() => (tocandoRef.current = true)}
        onPointerUp={() => (tocandoRef.current = false)}
        onTouchStart={() => (tocandoRef.current = true)}
        onTouchEnd={() => (tocandoRef.current = false)}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="cd-slide">
            {slide.tipo === 'imagen' ? (
              <img
                src={slide.src}
                alt={`Capta Delivery en ${ciudad}`}
                onError={() => setRotas((previas) => [...previas, slide.id])}
              />
            ) : slide.tipo === 'promo' ? (
              <a
                className="cd-slide-promo"
                href={`/${encodeURIComponent(slide.local.slug)}?vitrina=1`}
                style={{ '--cd-marca': slide.local.color || '#f4511e' }}
              >
                <span className="cd-slide-promo-etiqueta">Promo de hoy</span>
                <strong>{slide.local.promo}</strong>
                <span className="cd-slide-promo-local">
                  <MiniLogo local={slide.local} />
                  {slide.local.nombre}
                </span>
              </a>
            ) : (
              <Banner ciudad={ciudad} />
            )}
          </div>
        ))}
      </div>
      {total > 1 ? (
        <div className="cd-puntos-carrusel" aria-hidden="true">
          {slides.map((slide, i) => (
            <span key={slide.id} className={i === actual ? 'cd-punto-activo' : ''} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

/**
 * La barra de "Categorías" del inicio: una tarjeta con una fila de circulos que
 * se desliza (shared/vitrinaCapta.js, GRUPOS). La categoria elegida queda con el
 * nombre en negrita y subrayado naranja; arranca en la primera.
 *
 * Las imagenes de cada circulo son /capta/categorias/<id>.webp.
 */
function Categorias({ onElegir, onVerTodas }) {
  const [activo, setActivo] = useState(GRUPOS[0].id)
  return (
    <section className="cd-cats" aria-label="Categorías">
      <div className="cd-cats-cabeza">
        <h2>Categorías</h2>
        <button type="button" onClick={onVerTodas}>
          Ver todas <Icono nombre="arrow_forward" />
        </button>
      </div>
      <div className="cd-cats-fila">
        {GRUPOS.map((grupo) => (
          <button
            key={grupo.id}
            type="button"
            className={`cd-cat${grupo.id === activo ? ' cd-cat-activa' : ''}`}
            aria-pressed={grupo.id === activo}
            onClick={() => {
              setActivo(grupo.id)
              onElegir(grupo.id)
            }}
          >
            <span className="cd-cat-circulo" style={{ background: grupo.circulo || grupo.fondo }}>
              <img src={`/capta/categorias/${grupo.id}.webp?v=2`} alt="" width="300" height="300" decoding="async" />
            </span>
            <span className="cd-cat-nombre">{grupo.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** "★ 4.8 · 20-30 min" — las estrellas solo si hay opiniones de verdad. */
function LineaDeEstado({ local }) {
  const estrellas = local.calificacion ? (
    <span className="cd-estrellas">
      <Icono nombre="star" relleno /> {local.calificacion.promedio.toFixed(1)}
    </span>
  ) : null
  // Cerrado: cuando abre (entra en un renglon). Que se puede programar se ve
  // al entrar al menu, que es donde se elige la hora.
  const texto = local.abierto
    ? local.tiempo || 'Abierto'
    : local.pausado
      ? 'No toma pedidos'
      : cuandoAbre(local.proximaApertura) || 'Cerrado ahora'
  return (
    <p className={`cd-linea-estado ${local.abierto ? '' : 'cd-linea-cerrado'}`}>
      {estrellas}
      {estrellas ? <span className="cd-separador">·</span> : null}
      <span>{texto}</span>
    </p>
  )
}

/** La tarjeta de un comercio en las grillas. */
function TarjetaCerca({ local, esFavorito, onFavorito, enLista = false }) {
  const url = `/${encodeURIComponent(local.slug)}?vitrina=1`
  return (
    <article className={`cd-cerca ${enLista ? 'cd-cerca-lista' : ''} ${local.abierto ? '' : 'cd-cerca-cerrado'}`}>
      <a className="cd-cerca-foto" href={url} aria-label={`Ver el menú de ${local.nombre}`}>
        <Portada local={local} />
        {local.promo ? <span className="cd-promo-cinta">{local.promo}</span> : null}
        <span className="cd-cerca-pie-foto">
          <LogoLocal local={local} />
        </span>
      </a>
      <button
        type="button"
        className={`cd-favorito ${esFavorito ? 'cd-favorito-si' : ''}`}
        onClick={() => onFavorito(local.slug)}
        aria-pressed={esFavorito}
        aria-label={esFavorito ? `Sacar ${local.nombre} de guardados` : `Guardar ${local.nombre}`}
      >
        <Icono nombre="favorite" relleno={esFavorito} />
      </button>
      <a className="cd-cerca-cuerpo" href={url}>
        <h3>{local.nombre}</h3>
        <p className="cd-cerca-rubro">{local.categoriaNombre}</p>
        <LineaDeEstado local={local} />
      </a>
    </article>
  )
}

/** La lista en grilla de una pantalla ("Ver todos", una categoria, guardados, una busqueda). */
function ListaDeLocales({ locales, favoritos, onFavorito }) {
  const abiertos = locales.filter((l) => l.abierto)
  const cerrados = locales.filter((l) => !l.abierto)
  return (
    <>
      {abiertos.length ? (
        <div className="cd-grilla-cerca">
          {abiertos.map((local) => (
            <TarjetaCerca key={local.slug} local={local} esFavorito={favoritos.includes(local.slug)} onFavorito={onFavorito} enLista />
          ))}
        </div>
      ) : null}
      {cerrados.length ? (
        <>
          <div className="cd-seccion-cabeza cd-seccion-suave">
            <h2>Abren más tarde</h2>
            <span className="cd-cuenta">{cerrados.length}</span>
          </div>
          <div className="cd-grilla-cerca">
            {cerrados.map((local) => (
              <TarjetaCerca key={local.slug} local={local} esFavorito={favoritos.includes(local.slug)} onFavorito={onFavorito} enLista />
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}

/** Un producto encontrado en la busqueda: tocarlo abre su ficha en el menu del local. */
function ProductoEncontrado({ p }) {
  const [sinFoto, setSinFoto] = useState(false)
  const local = p.local
  const estado = local.abierto
    ? local.tiempo || 'Abierto'
    : local.programable
      ? 'Cerrado · podés programar'
      : cuandoAbre(local.proximaApertura) || 'Cerrado ahora'
  return (
    <a
      className={`cd-producto ${local.abierto ? '' : 'cd-producto-cerrado'}`}
      href={`/${encodeURIComponent(local.slug)}?vitrina=1&producto=${encodeURIComponent(p.id)}`}
    >
      {/* Sin foto no va nada en su lugar (ni el logo del local). */}
      {p.foto && !sinFoto ? (
        <img className="cd-producto-foto" src={p.foto} alt="" loading="lazy" onError={() => setSinFoto(true)} />
      ) : null}
      <span className="cd-producto-textos">
        <strong>{p.nombre}</strong>
        {p.descripcion ? <small className="cd-producto-desc">{p.descripcion}</small> : null}
        <small className="cd-producto-local">
          {local.nombre} · {estado}
        </small>
      </span>
      <span className="cd-producto-precio">{pesos(p.precio)}</span>
    </a>
  )
}

/** Un pedido de su cuenta (de cualquier local, de cualquier telefono). */
function FilaPedidoDeCuenta({ p, local, repetible }) {
  return (
    <div className="cd-pedido-fila">
      {local ? (
        <MiniLogo local={local} />
      ) : (
        <span className="cd-perfil-icono">
          <Icono nombre="receipt_long" />
        </span>
      )}
      <span className="cd-pedido-textos">
        <strong>
          {p.local || 'Pedido'} · #{p.numero}
        </strong>
        <small>
          {new Date(p.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {pesos(p.total)}
        </small>
        <small className={p.terminado ? '' : 'cd-pedido-estado-vivo'}>{p.estado}</small>
      </span>
      {!p.terminado && p.seguimiento ? (
        <a className="cd-boton-chico" href={p.seguimiento} target="_blank" rel="noopener noreferrer">
          Seguir
        </a>
      ) : repetible && local ? (
        <a className="cd-boton-chico cd-boton-suave" href={`/${encodeURIComponent(local.slug)}?vitrina=1&repetir=1`}>
          Repetir
        </a>
      ) : null}
    </div>
  )
}

/**
 * Pedidos. Con la cuenta abierta: los de TODOS sus locales y telefonos (los
 * trae el dashboard por su celular verificado). Sin cuenta: lo que quedo en
 * este telefono, y la invitacion a entrar.
 */
function MisPedidos({ locales, ultimos, mandadoEnCurso, sesion, pedidosCuenta, onEntro, onIrAlInicio }) {
  const conLocal = ultimos
    .map((pedido) => ({ pedido, local: locales.find((l) => l.slug === pedido.slug) }))
    .filter((x) => x.local)
  const repetibles = new Set(ultimos.map((u) => u.slug))
  const enCurso = (pedidosCuenta || []).filter((p) => !p.terminado)
  const anteriores = (pedidosCuenta || []).filter((p) => p.terminado)

  return (
    <section className="cd-pagina">
      <h1 className="cd-pagina-titulo">Tus pedidos</h1>
      {mandadoEnCurso ? (
        <a className="cd-pedido-fila cd-pedido-en-curso" href={mandadoEnCurso.seguimiento} target="_blank" rel="noopener noreferrer">
          <span className="cd-mandados-icono">
            <Icono nombre="route" />
          </span>
          <span className="cd-pedido-textos">
            <strong>Tu mandado{mandadoEnCurso.numero ? ` #${mandadoEnCurso.numero}` : ''}</strong>
            <small>En curso · tocá para ver en qué va</small>
          </span>
          <Icono nombre="chevron_right" />
        </a>
      ) : null}

      {sesion ? (
        pedidosCuenta === null ? (
          <p className="cd-hoja-texto">Cargando tus pedidos…</p>
        ) : pedidosCuenta.length ? (
          <>
            {enCurso.length ? <h2 className="cd-pedidos-subtitulo">En curso</h2> : null}
            {enCurso.map((p) => (
              <FilaPedidoDeCuenta key={`${p.slug}-${p.numero}`} p={p} local={locales.find((l) => l.slug === p.slug)} repetible={repetibles.has(p.slug)} />
            ))}
            {anteriores.length ? <h2 className="cd-pedidos-subtitulo">Anteriores</h2> : null}
            {anteriores.map((p) => (
              <FilaPedidoDeCuenta key={`${p.slug}-${p.numero}`} p={p} local={locales.find((l) => l.slug === p.slug)} repetible={repetibles.has(p.slug)} />
            ))}
          </>
        ) : (
          <div className="cd-vacio">
            <img className="cd-vacio-logo" src="/capta/logo-3d.webp" alt="" width="64" height="64" />
            <p>Todavía no hay pedidos con tu celular. Cuando pidas, los vas a ver acá.</p>
            <button type="button" className="cd-boton-chico" onClick={onIrAlInicio}>
              Ver locales
            </button>
          </div>
        )
      ) : (
        <>
          {conLocal.map(({ pedido, local }) => (
            <div key={local.slug} className="cd-pedido-fila">
              <MiniLogo local={local} />
              <span className="cd-pedido-textos">
                <strong>{local.nombre}</strong>
                <small>{resumenDelPedido(pedido, 3)}</small>
                <small className="cd-pedido-fecha">
                  {new Date(pedido.at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </small>
              </span>
              <a className="cd-boton-chico" href={`/${encodeURIComponent(local.slug)}?vitrina=1&repetir=1`}>
                {local.abierto ? 'Repetir' : local.programable ? 'Programar' : 'Ver'}
              </a>
            </div>
          ))}
          <div className="cd-tarjeta-ingresar">
            <Ingresar titulo="Entrá para ver todos tus pedidos" onListo={onEntro} />
          </div>
        </>
      )}
    </section>
  )
}

/** Perfil: su cuenta (o entrar), sus puntos, sus datos, la ciudad y los mandados. */
function Perfil({ ciudad, sesion, onSesion, onSalir, onPuntos, onDatos, onCiudad, onMandado }) {
  const datos = leerDatos(almacenDelNavegador())
  const filas = [
    { id: 'puntos', icono: 'stars', titulo: 'Mis puntos', detalle: 'Lo que juntaste pidiendo por Capta', accion: onPuntos },
    { id: 'datos', icono: 'badge', titulo: 'Mis datos', detalle: datos?.address ? datos.address : 'Dirección guardada en este teléfono', accion: onDatos },
    { id: 'ciudad', icono: 'location_on', titulo: 'Mi ciudad', detalle: ciudad || 'Elegí tu ciudad', accion: onCiudad },
    onMandado ? { id: 'mandado', icono: 'directions_bike', titulo: 'Pedir un mandado', detalle: 'Te compramos o llevamos lo que necesites', accion: onMandado } : null,
  ].filter(Boolean)
  return (
    <section className="cd-pagina">
      <h1 className="cd-pagina-titulo">Perfil</h1>
      {sesion ? (
        <NombreDeLaCuenta sesion={sesion} onCambio={onSesion} />
      ) : (
        <div className="cd-tarjeta-ingresar">
          <Ingresar onListo={onSesion} />
        </div>
      )}
      <div className="cd-perfil-lista">
        {filas.map((fila) => (
          <button key={fila.id} type="button" className="cd-perfil-fila" onClick={fila.accion}>
            <span className="cd-perfil-icono">
              <Icono nombre={fila.icono} />
            </span>
            <span className="cd-pedido-textos">
              <strong>{fila.titulo}</strong>
              <small>{fila.detalle}</small>
            </span>
            <Icono nombre="chevron_right" />
          </button>
        ))}
      </div>
      {sesion ? (
        <button type="button" className="cd-boton-borrar" onClick={onSalir}>
          Cerrar sesión
        </button>
      ) : null}
    </section>
  )
}

export default function CaptaDeliveryApp() {
  const { cargando, error, locales, ciudades: ciudadesConLocales, recargar } = useVitrina()
  const mandados = useMandados()
  const [ciudadElegida, setCiudadElegida] = useState(() => leerPreferencia(CLAVE_CIUDAD, ''))
  const [busqueda, setBusqueda] = useState('')
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = leerPreferencia(CLAVE_FAVORITOS, [])
    return Array.isArray(guardados) ? guardados : []
  })
  // inicio · todos ("Ver todos") · grupo (un cuadrado) · pedidos · guardados · perfil
  // La barra de abajo de un menu manda aca con ?vista=pedidos|guardados|perfil.
  const [vista, setVista] = useState(() => {
    try {
      const pedida = new URLSearchParams(window.location.search).get('vista')
      return ['pedidos', 'guardados', 'perfil'].includes(pedida) ? pedida : 'inicio'
    } catch {
      return 'inicio'
    }
  })
  const [grupoElegido, setGrupoElegido] = useState(null)
  const [subcategoria, setSubcategoria] = useState('todos')
  const [hoja, setHoja] = useState(() => {
    try {
      // La barra de abajo de un menu manda aca con ?hoja=puntos.
      return new URLSearchParams(window.location.search).get('hoja') === 'puntos' ? 'puntos' : null
    } catch {
      return null
    }
  }) // ciudad · categorias · puntos · datos · mandado
  const [dondeDelMandado, setDondeDelMandado] = useState('')
  // Los ultimos pedidos de este telefono, para "Volver a pedir" y "Pedidos".
  const [ultimosPedidos] = useState(() => leerUltimosPedidos(almacenDelNavegador()))
  // Los productos de TODOS los locales que coinciden con lo que escribe
  // (/api/delivery/buscar). Se pide 300 ms despues de que deja de escribir.
  const [encontrados, setEncontrados] = useState({ q: '', productos: [], cargando: false })

  // La cuenta (entrar con el celular y un codigo por WhatsApp). null = sin entrar.
  const [sesion, setSesion] = useState(leerSesion)
  // Los cupones del admin (Admin > Delivery > Cupones) y lo que se le regalo a
  // una cuenta nueva.
  const [cupones, setCupones] = useState({ ofertas: [], billetera: [] })
  const [bienvenida, setBienvenida] = useState(() => tomarBienvenida())
  const copiarCupon = (cupon) => {
    try {
      void navigator.clipboard?.writeText(cupon.codigo)
    } catch {
      // sin portapapeles: el codigo igual esta a la vista
    }
    setAvisoCupon(`Código ${cupon.codigo} copiado. Pegalo al hacer tu pedido.`)
  }
  const [avisoCupon, setAvisoCupon] = useState('')
  useEffect(() => {
    if (!avisoCupon) return undefined
    const t = setTimeout(() => setAvisoCupon(''), 3200)
    return () => clearTimeout(t)
  }, [avisoCupon])
  useEffect(() => {
    let vivo = true
    fetch('/api/delivery/cupones', {
      headers: sesion?.token ? { Authorization: `Bearer ${sesion.token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((datos) => {
        if (vivo && datos) setCupones({ ofertas: datos.ofertas || [], billetera: datos.billetera || [] })
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [sesion?.token])
  useEffect(() => {
    // Una cuenta que se acaba de abrir (desde el perfil): se muestra el regalo.
    if (!sesion?.token) return undefined
    const t = setTimeout(() => {
      const lista = tomarBienvenida()
      if (lista.length) setBienvenida(lista)
    }, 0)
    return () => clearTimeout(t)
  }, [sesion?.token])
  // Sus pedidos de todos los locales; null mientras se cargan.
  const [pedidosCuenta, setPedidosCuenta] = useState(null)

  // Con la cuenta abierta se traen sus datos y pedidos. Si la sesion vencio
  // (o la cerro en otro lado), se sale sola.
  const token = sesion?.token || null
  useEffect(() => {
    if (!token) return undefined
    let vivo = true
    pedirCuenta('GET', null, token)
      .then((datos) => {
        if (!vivo) return
        setPedidosCuenta(Array.isArray(datos?.pedidos) ? datos.pedidos : [])
        if (datos?.cliente) setSesion((s) => (s ? { ...s, cliente: datos.cliente } : s))
      })
      .catch((e) => {
        if (!vivo) return
        if (e.status === 401) {
          borrarSesion()
          setSesion(null)
        }
        setPedidosCuenta([])
      })
    return () => {
      vivo = false
    }
  }, [token])

  const salir = () => {
    if (token) void pedirCuenta('POST', { accion: 'salir' }, token).catch(() => {})
    borrarSesion()
    setSesion(null)
    setPedidosCuenta(null)
  }

  // Las ciudades para elegir: las que tienen locales y, al final, las que por
  // ahora solo tienen mandados.
  const ciudades = useMemo(() => {
    const soloMandados = mandados
      .filter((m) => !ciudadesConLocales.some((c) => ciudadPareja(c.nombre) === ciudadPareja(m.ciudad)))
      .map((m) => ({ nombre: m.ciudad, locales: 0 }))
    return [...ciudadesConLocales, ...soloMandados]
  }, [ciudadesConLocales, mandados])

  // La ciudad que se esta mirando: la que eligio la vez pasada, si todavia
  // tiene locales, y si no la que mas tiene. Se calcula en vez de corregirse
  // con un efecto, asi la primera pantalla ya sale bien.
  const ciudad = useMemo(() => {
    if (!ciudades.length) return ''
    const guardada = ciudades.find((c) => ciudadPareja(c.nombre) === ciudadPareja(ciudadElegida))
    return guardada ? guardada.nombre : ciudades[0].nombre
  }, [ciudades, ciudadElegida])

  const elegirCiudad = (nombre) => {
    setCiudadElegida(nombre)
    guardarPreferencia(CLAVE_CIUDAD, nombre)
    setHoja(null)
  }

  const alternarFavorito = (slug) => {
    setFavoritos((previos) => {
      const siguientes = previos.includes(slug)
        ? previos.filter((x) => x !== slug)
        : [...previos, slug]
      guardarPreferencia(CLAVE_FAVORITOS, siguientes)
      return siguientes
    })
  }

  // Los mandados de la ciudad que se esta mirando, si Capta los hace ahi.
  const mandadoDeLaCiudad = useMemo(
    () => mandados.find((m) => ciudadPareja(m.ciudad) === ciudadPareja(ciudad)) ?? null,
    [mandados, ciudad],
  )
  const [mandadoEnCurso] = useState(() => leerEnCurso(null))

  const deLaCiudad = useMemo(() => {
    if (!ciudad) return locales
    return locales.filter((local) => ciudadPareja(local.ciudad) === ciudadPareja(ciudad))
  }, [locales, ciudad])

  const consulta = busqueda.trim()
  useEffect(() => {
    if (consulta.length < 2) return undefined
    let vivo = true
    const espera = window.setTimeout(() => {
      setEncontrados((e) => ({ ...e, cargando: true }))
      fetch(`/api/delivery/buscar?q=${encodeURIComponent(consulta)}&ciudad=${encodeURIComponent(ciudad || '')}`)
        .then((r) => (r.ok ? r.json() : { productos: [] }))
        .then((datos) => {
          if (vivo) setEncontrados({ q: consulta, productos: Array.isArray(datos?.productos) ? datos.productos : [], cargando: false })
        })
        .catch(() => {
          if (vivo) setEncontrados({ q: consulta, productos: [], cargando: false })
        })
    }, 300)
    return () => {
      vivo = false
      window.clearTimeout(espera)
    }
  }, [consulta, ciudad])
  // Las categorias que coinciden con lo buscado ("helado" -> Heladerias): un
  // acceso directo arriba de los resultados. Solo las que tienen locales en la
  // ciudad, o las que se pueden pedir con un mandado.
  const categoriasDeLaBusqueda = useMemo(() => {
    const palabras = palabrasDeLaBusqueda(consulta)
    if (!palabras.length) return []
    return CATEGORIAS.map((c) => {
      const grupo = GRUPOS.find((g) => g.categorias.includes(c.id))
      const cuantos = deLaCiudad.filter((l) => l.categoria === c.id).length
      const porNombre = palabras.every((p) => normalizarTexto(`${c.label} ${c.singular}`).includes(p))
      return { ...c, grupo, cuantos, coincide: porNombre || coincideConElRubro(c.id, palabras) }
    }).filter((c) => c.coincide && c.grupo && (c.cuantos > 0 || (c.grupo.mandado && mandadoDeLaCiudad)))
  }, [consulta, deLaCiudad, mandadoDeLaCiudad])

  // Lo que se muestra es solo lo de la busqueda actual (no la anterior).
  const productosDeLaBusqueda = consulta.length >= 2 && encontrados.q === consulta ? encontrados.productos : []
  const buscandoProductos = consulta.length >= 2 && (encontrados.cargando || encontrados.q !== consulta)


  // Los comercios de la ciudad: primero lo que se puede pedir ya, despues lo
  // que se puede programar, al final lo cerrado.
  const cercaDeTi = useMemo(
    () =>
      [...deLaCiudad].sort(
        (a, b) =>
          Number(b.abierto) - Number(a.abierto) ||
          Number(b.programable) - Number(a.programable) ||
          a.nombre.localeCompare(b.nombre),
      ),
    [deLaCiudad],
  )

  const grupo = GRUPOS.find((g) => g.id === grupoElegido) ?? null
  const delGrupo = useMemo(
    () => (grupo ? cercaDeTi.filter((l) => grupo.categorias.includes(l.categoria)) : []),
    [grupo, cercaDeTi],
  )
  // Las sub-categorias del cuadrado que tienen algun local ("Comida" ->
  // Pizzerias, Hamburgueserias...). Con una sola no hace falta elegir.
  const subcategorias = useMemo(
    () => CATEGORIAS.filter((c) => delGrupo.some((l) => l.categoria === c.id)),
    [delGrupo],
  )
  const sub = subcategorias.some((c) => c.id === subcategoria) ? subcategoria : 'todos'

  // Lo que muestra una pantalla de lista.
  const enLista = useMemo(() => {
    let base = cercaDeTi
    if (vista === 'guardados') base = locales.filter((l) => favoritos.includes(l.slug))
    if (vista === 'grupo') base = delGrupo.filter((l) => sub === 'todos' || l.categoria === sub)
    return base.filter((local) => localCoincideCon(local, busqueda))
  }, [vista, cercaDeTi, locales, favoritos, delGrupo, sub, busqueda])

  // Volver a pedir: solo locales que siguen en la vitrina y son de esta ciudad.
  const paraRepetir = useMemo(
    () =>
      ultimosPedidos
        .map((pedido) => ({ pedido, local: deLaCiudad.find((l) => l.slug === pedido.slug) }))
        .filter((x) => x.local)
        .slice(0, 4),
    [ultimosPedidos, deLaCiudad],
  )

  // Promos de hoy: primero las que se pueden pedir ya.
  const conPromo = useMemo(
    () =>
      deLaCiudad
        .filter((l) => l.promo)
        .sort((a, b) => Number(b.abierto) - Number(a.abierto) || Number(b.programable) - Number(a.programable)),
    [deLaCiudad],
  )

  const irA = (siguiente) => {
    // Con "Mis puntos" abierta, tocar otro boton de la barra la cierra.
    setHoja((actual) => (actual === 'puntos' ? null : actual))
    setVista(siguiente)
    setBusqueda('')
    if (siguiente !== 'grupo') setGrupoElegido(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const abrirGrupo = (id) => {
    setGrupoElegido(id)
    setSubcategoria('todos')
    setHoja(null)
    setVista('grupo')
    setBusqueda('')
    window.scrollTo({ top: 0 })
  }

  const pedirMandado = (donde = '') => {
    setDondeDelMandado(donde)
    setHoja('mandado')
  }

  const esInicio = vista === 'inicio' && !busqueda
  const esLista = ['todos', 'grupo', 'guardados'].includes(vista) || (vista === 'inicio' && busqueda)
  const tituloLista =
    vista === 'guardados'
      ? 'Guardados'
      : vista === 'grupo' && grupo
        ? grupo.label
        : busqueda
          ? `“${busqueda.trim()}”`
          : ciudad
            ? `Todos en ${ciudad}`
            : 'Todos los locales'

  return (
    <div className="cd-app">
      <header className="cd-cabecera">
        <a className="cd-marca" href="/pedi" aria-label="Capta Delivery">
          <img className="cd-marca-logo" src="/capta/logo-3d.webp" alt="" width="56" height="56" />
          <span>
            <strong>Capta</strong>
            <em>Delivery</em>
          </span>
        </a>

        {ciudades.length ? (
          <button type="button" className="cd-ciudad" onClick={() => setHoja('ciudad')}>
            <Icono nombre="location_on" relleno />
            <span>
              <strong>
                {ciudad || 'Elegí tu ciudad'}
                <Icono nombre="expand_more" />
              </strong>
              <small>Tu ciudad, más cerca</small>
            </span>
          </button>
        ) : null}
      </header>

      {vista !== 'pedidos' && vista !== 'perfil' ? (
        <div className="cd-buscador">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.8" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="m15.6 15.6 4.9 4.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="¿Qué se te antoja hoy?"
            aria-label="Buscar un local"
          />
          {busqueda ? (
            <button type="button" onClick={() => setBusqueda('')} aria-label="Borrar la búsqueda">
              <Icono nombre="close" />
            </button>
          ) : null}
        </div>
      ) : null}

      <main className="cd-contenido">
        {error ? (
          <div className="cd-aviso">
            <p>{error}</p>
            <button type="button" onClick={() => void recargar()}>
              Reintentar
            </button>
          </div>
        ) : null}

        {esInicio ? (
          <>
            <Carrusel key={ciudad} ciudad={ciudad} promos={conPromo} />

            <Categorias onElegir={abrirGrupo} onVerTodas={() => setHoja('categorias')} />

            {bienvenida.length ? (
              <div className="cd-bienvenida" role="status">
                <strong>¡Bienvenido a Capta!</strong>
                <span>Te regalamos: {bienvenida.map((b) => `${b.texto} (${b.codigo})`).join(' · ')}. Los usás al pedir.</span>
                <button type="button" onClick={() => setBienvenida([])} aria-label="Cerrar">×</button>
              </div>
            ) : null}

            <OfertasParaVos cupones={cupones} onCopiar={copiarCupon} />

            {/* Todos los comercios de la ciudad, abajo de las categorias: primero
                los abiertos y despues "Abren más tarde". */}
            <section className="cd-seccion" aria-label="Comercios">
              <div className="cd-seccion-cabeza">
                <h2>{ciudad ? `Comercios en ${ciudad}` : 'Comercios'}</h2>
                {!cargando ? <span className="cd-cuenta">{cercaDeTi.length}</span> : null}
              </div>
              {cargando ? (
                <div className="cd-grilla-cerca">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="cd-cerca cd-esqueleto" aria-hidden="true">
                      <div className="cd-cerca-foto" />
                      <div className="cd-cerca-cuerpo">
                        <span />
                        <span />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cercaDeTi.length ? (
                <ListaDeLocales locales={cercaDeTi} favoritos={favoritos} onFavorito={alternarFavorito} />
              ) : !error ? (
                <p className="cd-hoja-texto">Por ahora no hay locales en {ciudad || 'esta ciudad'}.</p>
              ) : null}
            </section>

            {mandadoDeLaCiudad ? (
              <EntradaMandados mandado={mandadoDeLaCiudad} onAbrir={() => pedirMandado('')} />
            ) : null}

            {!cargando && paraRepetir.length ? <VolverAPedir pedidos={paraRepetir} /> : null}

            {!cargando && conPromo.length ? <PromosDeHoy locales={conPromo} /> : null}
          </>
        ) : null}

        {esLista ? (
          <section className="cd-pagina">
            <div className="cd-pagina-cabeza">
              <button type="button" className="cd-volver" onClick={() => irA('inicio')} aria-label="Volver al inicio">
                <Icono nombre="arrow_back" />
              </button>
              <h1 className="cd-pagina-titulo">{tituloLista}</h1>
              {/* En una busqueda cada seccion (productos, locales) lleva su numero. */}
              {busqueda ? null : <span className="cd-cuenta">{enLista.length}</span>}
            </div>

            {vista === 'grupo' && subcategorias.length > 1 ? (
              <div className="cd-categorias" role="tablist" aria-label="Tipo">
                {[{ id: 'todos', label: 'Todos' }, ...subcategorias].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={sub === c.id}
                    className={sub === c.id ? 'cd-chip cd-chip-activo' : 'cd-chip'}
                    onClick={() => setSubcategoria(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : null}

            {vista === 'inicio' && busqueda && categoriasDeLaBusqueda.length ? (
              <div className="cd-cats-encontradas" aria-label="Categorías">
                {categoriasDeLaBusqueda.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="cd-cat-encontrada"
                    onClick={() => {
                      abrirGrupo(c.grupo.id)
                      if (c.grupo.categorias.length > 1) setSubcategoria(c.id)
                    }}
                  >
                    <img src={`/capta/categorias/${c.grupo.id}.webp?v=2`} alt="" style={{ background: c.grupo.fondo }} />
                    <span>
                      <strong>{c.label}</strong>
                      <small>{c.cuantos ? `${c.cuantos} local${c.cuantos === 1 ? '' : 'es'}` : 'Con mandados'}</small>
                    </span>
                    <Icono nombre="chevron_right" />
                  </button>
                ))}
              </div>
            ) : null}

            {vista === 'inicio' && busqueda ? (
              <section className="cd-resultados-productos" aria-label="Productos">
                <div className="cd-seccion-cabeza cd-seccion-suave">
                  <h2>Productos</h2>
                  {!buscandoProductos ? <span className="cd-cuenta">{productosDeLaBusqueda.length}</span> : null}
                </div>
                {buscandoProductos && !productosDeLaBusqueda.length ? (
                  <p className="cd-hoja-texto">Buscando en todos los locales…</p>
                ) : productosDeLaBusqueda.length ? (
                  <div className="cd-lista-productos">
                    {productosDeLaBusqueda.map((p) => (
                      <ProductoEncontrado key={`${p.local.slug}-${p.id}`} p={p} />
                    ))}
                  </div>
                ) : consulta.length >= 2 ? (
                  <p className="cd-hoja-texto">Ningún local tiene un producto con &quot;{consulta}&quot;.</p>
                ) : null}
                {enLista.length ? (
                  <div className="cd-seccion-cabeza cd-seccion-suave">
                    <h2>Locales</h2>
                    <span className="cd-cuenta">{enLista.length}</span>
                  </div>
                ) : null}
              </section>
            ) : null}

            {cargando ? null : enLista.length ? (
              <ListaDeLocales locales={enLista} favoritos={favoritos} onFavorito={alternarFavorito} />
            ) : vista === 'inicio' && busqueda && (productosDeLaBusqueda.length || buscandoProductos) ? null : (
              <div className="cd-vacio">
                {vista === 'grupo' && grupo ? (
                  <img className="cd-vacio-icono" src={`/capta/categorias/${grupo.id}.webp?v=2`} alt="" style={{ background: grupo.fondo }} />
                ) : (
                  <img className="cd-vacio-logo" src="/capta/logo-3d.webp" alt="" width="64" height="64" />
                )}
                <p>
                  {vista === 'guardados'
                    ? 'Todavía no guardaste ningún local. Tocá el corazón de una tarjeta.'
                    : busqueda
                      ? `No encontramos nada con "${busqueda}".`
                      : grupo
                        ? `Todavía no hay locales de ${grupo.label.toLowerCase()} en ${ciudad || 'tu ciudad'} con Capta.`
                        : 'Por ahora no hay locales en esta ciudad.'}
                </p>
                {vista === 'grupo' && grupo?.mandado && mandadoDeLaCiudad ? (
                  <button type="button" className="cd-boton-chico" onClick={() => pedirMandado(grupo.mandado)}>
                    Te lo compramos con un mandado
                  </button>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {vista === 'pedidos' ? (
          <MisPedidos
            locales={locales}
            ultimos={ultimosPedidos}
            mandadoEnCurso={mandadoEnCurso}
            sesion={sesion}
            pedidosCuenta={pedidosCuenta}
            onEntro={(nueva) => {
              setPedidosCuenta(null)
              setSesion(nueva)
            }}
            onIrAlInicio={() => irA('inicio')}
          />
        ) : null}

        {vista === 'perfil' ? (
          <Perfil
            ciudad={ciudad}
            sesion={sesion}
            onSesion={(nueva) => {
              if (nueva?.token !== token) setPedidosCuenta(null)
              setSesion(nueva)
            }}
            onSalir={salir}
            onPuntos={() => setHoja('puntos')}
            onDatos={() => setHoja('datos')}
            onCiudad={() => setHoja('ciudad')}
            onMandado={mandadoDeLaCiudad ? () => pedirMandado('') : null}
          />
        ) : null}

        <p className="cd-pie">Los pedidos los toma cada local en su menú. Los reparte Capta Delivery.</p>
      </main>

      {avisoCupon ? (
        <div className="cd-toast-cupon" role="status">
          {avisoCupon}
        </div>
      ) : null}

      <BarraInferior vista={vista} guardados={favoritos.length} onVista={irA} onPuntos={() => setHoja('puntos')} puntosAbierto={hoja === 'puntos'} />

      {hoja === 'ciudad' ? (
        <Hoja titulo="Elegí tu ciudad" onCerrar={() => setHoja(null)}>
          <ul className="cd-lista-ciudades">
            {ciudades.map((c) => (
              <li key={c.nombre}>
                <button
                  type="button"
                  className={ciudadPareja(c.nombre) === ciudadPareja(ciudad) ? 'cd-ciudad-elegida' : ''}
                  onClick={() => elegirCiudad(c.nombre)}
                >
                  <span>{c.nombre}</span>
                  <small>{c.locales ? `${c.locales} local${c.locales === 1 ? '' : 'es'}` : 'Mandados'}</small>
                </button>
              </li>
            ))}
          </ul>
        </Hoja>
      ) : null}

      {hoja === 'categorias' ? (
        <Hoja titulo="Categorías" onCerrar={() => setHoja(null)}>
          <ul className="cd-lista-categorias">
            {GRUPOS.map((g) => {
              const cuantos = deLaCiudad.filter((l) => g.categorias.includes(l.categoria)).length
              return (
                <li key={g.id}>
                  <button type="button" onClick={() => abrirGrupo(g.id)}>
                    <img src={`/capta/categorias/${g.id}.webp?v=2`} alt="" style={{ background: g.fondo }} />
                    <span>{g.label}</span>
                    <small>{cuantos ? `${cuantos} local${cuantos === 1 ? '' : 'es'}` : g.mandado && mandadoDeLaCiudad ? 'Con mandados' : 'Próximamente'}</small>
                  </button>
                </li>
              )
            })}
          </ul>
        </Hoja>
      ) : null}

      {hoja === 'mandado' && mandadoDeLaCiudad ? (
        <Hoja titulo="Pedí un mandado" onCerrar={() => setHoja(null)}>
          <FormularioMandado key={dondeDelMandado} mandado={mandadoDeLaCiudad} dondeInicial={dondeDelMandado} />
        </Hoja>
      ) : null}

      {hoja === 'puntos' ? <MisPuntosHoja onCerrar={() => setHoja(null)} /> : null}

      {hoja === 'datos' ? <MisDatos onCerrar={() => setHoja(null)} /> : null}
    </div>
  )
}

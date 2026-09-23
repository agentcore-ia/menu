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

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORIAS, ciudadPareja, localCoincideCon } from '../shared/vitrinaCapta.js'
import { almacenDelNavegador, leerDatos, olvidarDatos } from '../shared/datosDelCliente.js'
import { celularValido, normalizarCelular } from '../shared/celular.js'
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

function TarjetaLocal({ local, esFavorito, onFavorito }) {
  const url = `/${encodeURIComponent(local.slug)}?vitrina=1`

  return (
    <article className={`cd-tarjeta ${local.abierto ? '' : 'cd-tarjeta-cerrada'}`}>
      <a className="cd-tarjeta-foto" href={url} aria-label={`Ver el menú de ${local.nombre}`}>
        <Portada local={local} />
        <LogoLocal local={local} />
        {local.abierto ? null : (
          <span className="cd-cartel-cerrado">{local.pausado ? 'No toma pedidos' : 'Cerrado'}</span>
        )}
      </a>
      <button
        type="button"
        className={`cd-favorito ${esFavorito ? 'cd-favorito-si' : ''}`}
        onClick={() => onFavorito(local.slug)}
        aria-pressed={esFavorito}
        aria-label={esFavorito ? `Sacar ${local.nombre} de favoritos` : `Guardar ${local.nombre} en favoritos`}
      >
        <Icono nombre="favorite" relleno={esFavorito} />
      </button>

      <div className="cd-tarjeta-cuerpo">
        <h3 className="cd-tarjeta-nombre">{local.nombre}</h3>
        <p className="cd-tarjeta-rubro">{local.categoriaNombre}</p>
        <div className="cd-tarjeta-pie">
          <p className="cd-tarjeta-estado">
            {local.abierto ? (
              <>
                <span className="cd-punto cd-punto-abierto" />
                Abierto{local.tiempo ? ` · ${local.tiempo}` : ''}
              </>
            ) : (
              <>
                <span className="cd-punto" />
                {cuandoAbre(local.proximaApertura) || 'Cerrado ahora'}
              </>
            )}
          </p>
          <a className="cd-boton-menu" href={url}>
            Ver menú
          </a>
        </div>
        {local.envioDesde ? (
          <p className="cd-tarjeta-envio">Envío desde {pesos(local.envioDesde)}</p>
        ) : null}
      </div>
    </article>
  )
}

function Hoja({ titulo, children, onCerrar }) {
  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  return (
    <div className="cd-hoja-fondo" role="dialog" aria-modal="true" aria-label={titulo} onClick={onCerrar}>
      <div className="cd-hoja" onClick={(evento) => evento.stopPropagation()}>
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
          <source srcSet={`/capta/banner-${clave}.webp`} type="image/webp" />
          <img
            src={`/capta/banner-${clave}.png`}
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

/**
 * Los puntos de Capta Delivery del cliente.
 *
 * Se entra con el celular, que es lo unico que identifica a un cliente en todo
 * el sistema: no hay cuenta ni contrasena. El numero queda guardado en ESTE
 * telefono para no tener que escribirlo cada vez.
 */
function MisPuntos({ onCerrar }) {
  const [celular, setCelular] = useState(() => {
    const guardado = leerPreferencia(CLAVE_CELULAR, '')
    if (typeof guardado === 'string' && guardado) return guardado
    // Si ya hizo un pedido desde este telefono, el numero ya lo tenemos.
    const datos = leerDatos(almacenDelNavegador())
    return datos?.phone ? String(datos.phone) : ''
  })
  const [consultado, setConsultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const buscar = async (numero) => {
    if (!celularValido(numero)) {
      setError('Poné tu celular con la característica, como lo escribís en el pedido.')
      return
    }
    setCargando(true)
    setError('')
    try {
      const telefono = normalizarCelular(numero)
      const respuesta = await fetch(`/api/delivery/puntos?telefono=${encodeURIComponent(telefono)}`)
      if (!respuesta.ok) throw new Error('no anduvo')
      const datos = await respuesta.json()
      setConsultado(datos)
      guardarPreferencia(CLAVE_CELULAR, numero)
    } catch {
      setError('No pudimos consultar tus puntos. Probá de nuevo en un rato.')
    } finally {
      setCargando(false)
    }
  }

  const config = consultado?.config ?? null
  const activo = config?.activo === true

  return (
    <Hoja titulo="Mis puntos" onCerrar={onCerrar}>
      <form
        className="cd-puntos-form"
        onSubmit={(evento) => {
          evento.preventDefault()
          void buscar(celular)
        }}
      >
        <label>
          <span>Tu celular</span>
          <input
            type="tel"
            inputMode="tel"
            value={celular}
            onChange={(evento) => setCelular(evento.target.value)}
            placeholder="Ej: 2346 587122"
          />
        </label>
        <button type="submit" disabled={cargando}>
          {cargando ? 'Buscando…' : 'Ver mis puntos'}
        </button>
      </form>

      {error ? <p className="cd-puntos-error">{error}</p> : null}

      {consultado ? (
        activo ? (
          <>
            <div className="cd-puntos-saldo">
              <span>Tenés</span>
              <strong>{consultado.puntos}</strong>
              <small>
                {consultado.puntos === 1 ? 'punto' : 'puntos'} · {pesos(consultado.pesos)} para usar
              </small>
            </div>

            <p className="cd-puntos-como">
              Juntás 1 punto por cada {pesos(config.pesosPorPunto)} de comida en los pedidos que
              hacés desde acá. Los usás como descuento en cualquier local de la lista, desde{' '}
              {config.minimoParaCanjear} puntos y hasta {pesos(config.topePorPedido)} por pedido.
              El descuento lo pone Capta: el negocio cobra lo mismo.
            </p>

            {consultado.movimientos?.length ? (
              <ul className="cd-puntos-movimientos">
                {consultado.movimientos.map((m, i) => (
                  <li key={`${m.creado_at}-${i}`}>
                    <div>
                      <strong>{m.tipo === 'canje' ? 'Usaste puntos' : m.tipo === 'gana' ? 'Sumaste' : 'Ajuste'}</strong>
                      <small>{m.detalle || ''}</small>
                    </div>
                    <span className={m.puntos < 0 ? 'cd-puntos-resta' : 'cd-puntos-suma'}>
                      {m.puntos > 0 ? '+' : ''}
                      {m.puntos}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cd-puntos-vacio">
                Todavía no tenés movimientos. Hacé tu primer pedido desde la app y empezás a sumar.
              </p>
            )}
          </>
        ) : (
          <p className="cd-puntos-vacio">Los puntos de Capta todavía no están habilitados.</p>
        )
      ) : null}
    </Hoja>
  )
}

function BarraInferior({ vista, onVista, favoritos }) {
  const items = [
    { id: 'inicio', icono: 'home', texto: 'Inicio' },
    { id: 'categorias', icono: 'grid_view', texto: 'Categorías' },
    { id: 'favoritos', icono: 'favorite', texto: 'Favoritos', globo: favoritos || 0 },
    { id: 'puntos', icono: 'stars', texto: 'Puntos' },
    { id: 'datos', icono: 'person', texto: 'Mis datos' },
  ]

  return (
    <nav className="cd-barra-inferior" aria-label="Secciones">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={vista === item.id ? 'cd-nav-activo' : ''}
          onClick={() => onVista(item.id)}
        >
          <span className="cd-nav-icono">
            <Icono nombre={item.icono} relleno={vista === item.id} />
            {item.globo ? <span className="cd-globo">{item.globo}</span> : null}
          </span>
          {item.texto}
        </button>
      ))}
    </nav>
  )
}

export default function CaptaDeliveryApp() {
  const { cargando, error, locales, ciudades, recargar } = useVitrina()
  const [ciudadElegida, setCiudadElegida] = useState(() => leerPreferencia(CLAVE_CIUDAD, ''))
  const [categoriaElegida, setCategoriaElegida] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = leerPreferencia(CLAVE_FAVORITOS, [])
    return Array.isArray(guardados) ? guardados : []
  })
  const [vista, setVista] = useState('inicio')
  const [eligiendoCiudad, setEligiendoCiudad] = useState(false)

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
    setEligiendoCiudad(false)
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

  const deLaCiudad = useMemo(() => {
    if (!ciudad) return locales
    return locales.filter((local) => ciudadPareja(local.ciudad) === ciudadPareja(ciudad))
  }, [locales, ciudad])

  // Los botones de categoria son SOLO los que tienen algun local en esa ciudad:
  // un filtro que no devuelve nada no sirve de nada.
  const categoriasVisibles = useMemo(() => {
    const cuenta = new Map()
    for (const local of deLaCiudad) cuenta.set(local.categoria, (cuenta.get(local.categoria) ?? 0) + 1)
    return CATEGORIAS.filter((c) => cuenta.has(c.id)).map((c) => ({ ...c, cuantos: cuenta.get(c.id) }))
  }, [deLaCiudad])

  // Si la categoria elegida se quedo sin locales (cambio de ciudad), se vuelve
  // sola a "Todos" en vez de mostrar una lista vacia.
  const categoria = categoriasVisibles.some((c) => c.id === categoriaElegida) ? categoriaElegida : 'todos'

  const filtrados = useMemo(() => {
    const base = vista === 'favoritos' ? locales.filter((l) => favoritos.includes(l.slug)) : deLaCiudad
    return base
      .filter((local) => categoria === 'todos' || local.categoria === categoria)
      .filter((local) => localCoincideCon(local, busqueda))
  }, [vista, locales, favoritos, deLaCiudad, categoria, busqueda])

  const abiertos = filtrados.filter((local) => local.abierto)
  const cerrados = filtrados.filter((local) => !local.abierto)

  return (
    <div className="cd-app">
      <header className="cd-cabecera">
        <a className="cd-marca" href="/pedi">
          <LogoCapta tamano={42} />
          <span>
            <strong>Capta</strong>
            <small>Delivery</small>
          </span>
        </a>

        {ciudades.length ? (
          <button type="button" className="cd-ciudad" onClick={() => setEligiendoCiudad(true)}>
            <Icono nombre="location_on" relleno />
            <span>
              <strong>{ciudad || 'Elegí tu ciudad'}</strong>
              <small>Tu ciudad, más cerca</small>
            </span>
            <Icono nombre="expand_more" />
          </button>
        ) : null}
      </header>

      <div className="cd-buscador">
        <Icono nombre="search" />
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

      {categoriasVisibles.length > 1 ? (
        <div className="cd-categorias" role="tablist" aria-label="Categorias">
          <button
            type="button"
            role="tab"
            aria-selected={categoria === 'todos'}
            className={categoria === 'todos' ? 'cd-chip cd-chip-activo' : 'cd-chip'}
            onClick={() => setCategoriaElegida('todos')}
          >
            Todos
          </button>
          {categoriasVisibles.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={categoria === c.id}
              className={categoria === c.id ? 'cd-chip cd-chip-activo' : 'cd-chip'}
              onClick={() => setCategoriaElegida(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      <main className="cd-contenido">
        {vista === 'inicio' && !busqueda && categoria === 'todos' ? (
          <Banner key={ciudad} ciudad={ciudad} />
        ) : null}

        {cargando ? (
          <div className="cd-grilla">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="cd-tarjeta cd-esqueleto" aria-hidden="true">
                <div className="cd-portada" />
                <div className="cd-tarjeta-cuerpo">
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="cd-aviso">
            <p>{error}</p>
            <button type="button" onClick={() => void recargar()}>
              Reintentar
            </button>
          </div>
        ) : null}

        {!cargando && !error ? (
          <>
            <div className="cd-titulo-seccion">
              <h2>
                {vista === 'favoritos'
                  ? 'Tus favoritos'
                  : ciudad
                    ? `Comercios en ${ciudad}`
                    : 'Comercios'}
              </h2>
              <span>{filtrados.length}</span>
            </div>

            {filtrados.length ? (
              <>
                <div className="cd-grilla">
                  {abiertos.map((local) => (
                    <TarjetaLocal
                      key={local.slug}
                      local={local}
                      esFavorito={favoritos.includes(local.slug)}
                      onFavorito={alternarFavorito}
                    />
                  ))}
                </div>

                {cerrados.length ? (
                  <>
                    <div className="cd-titulo-seccion cd-titulo-suave">
                      <h2>Abren más tarde</h2>
                      <span>{cerrados.length}</span>
                    </div>
                    <div className="cd-grilla">
                      {cerrados.map((local) => (
                        <TarjetaLocal
                          key={local.slug}
                          local={local}
                          esFavorito={favoritos.includes(local.slug)}
                          onFavorito={alternarFavorito}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <div className="cd-vacio">
                <LogoCapta tamano={64} />
                <p>
                  {vista === 'favoritos'
                    ? 'Todavía no guardaste ningún local. Tocá el corazón de una tarjeta.'
                    : busqueda
                      ? `No encontramos nada con "${busqueda}".`
                      : 'Por ahora no hay locales en esta ciudad.'}
                </p>
              </div>
            )}
          </>
        ) : null}

        <p className="cd-pie">
          Los pedidos los toma cada local en su menú. Los reparte Capta Delivery.
        </p>
      </main>

      <BarraInferior
        vista={vista}
        favoritos={favoritos.length}
        onVista={(siguiente) => {
          if (siguiente === 'datos' || siguiente === 'puntos') {
            setVista(siguiente)
            return
          }
          setVista(siguiente)
          if (siguiente === 'categorias') {
            document.querySelector('.cd-categorias')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          if (siguiente === 'inicio') {
            setCategoriaElegida('todos')
            setBusqueda('')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }}
      />

      {eligiendoCiudad ? (
        <Hoja titulo="Elegí tu ciudad" onCerrar={() => setEligiendoCiudad(false)}>
          <ul className="cd-lista-ciudades">
            {ciudades.map((c) => (
              <li key={c.nombre}>
                <button
                  type="button"
                  className={ciudadPareja(c.nombre) === ciudadPareja(ciudad) ? 'cd-ciudad-elegida' : ''}
                  onClick={() => elegirCiudad(c.nombre)}
                >
                  <span>{c.nombre}</span>
                  <small>{c.locales} local{c.locales === 1 ? '' : 'es'}</small>
                </button>
              </li>
            ))}
          </ul>
        </Hoja>
      ) : null}

      {vista === 'puntos' ? <MisPuntos onCerrar={() => setVista('inicio')} /> : null}

      {vista === 'datos' ? <MisDatos onCerrar={() => setVista('inicio')} /> : null}
    </div>
  )
}

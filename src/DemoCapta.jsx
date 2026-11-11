import { lazy, Suspense, useEffect, useState } from 'react'
import { TarjetaCerca } from './CaptaDeliveryApp.jsx'
import SliderComercios from './SliderComercios.jsx'
import { comerciosDemo } from './demoCaptaDatos.js'
import './demo-capta.css'

const DEMO = '/demo'
const MenuApp = lazy(() => import('./MenuApp.jsx'))
const MASCOTA = 'https://seguimiento.capta.ar/seguimiento-mascota'
const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const hora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' })

const estados = [
  { id: 'received', nombre: 'Pedido recibido', titulo: '¡Recibimos tu pedido!', texto: 'Tu pedido quedó registrado.', icono: 'receipt_long' },
  { id: 'preparing', nombre: 'En preparación', titulo: 'Tu pedido está en preparación', texto: 'La cocina ya está trabajando en tu pedido.', icono: 'skillet' },
  { id: 'ready', nombre: 'Listo para salir', titulo: '¡Tu pedido está listo!', texto: 'Tu pedido está listo para el reparto.', icono: 'shopping_bag' },
  { id: 'riding', nombre: 'En camino', titulo: '¡Tu pedido está en camino!', texto: 'El repartidor está llevando tu pedido.', icono: 'delivery_dining' },
  { id: 'delivered', nombre: 'Pedido entregado', titulo: '¡Tu pedido llegó!', texto: '¡Que lo disfrutes!', icono: 'package_2' },
]

const estadosRetiro = estados.filter(({ id }) => id !== 'riding').map((estado) => {
  if (estado.id === 'ready') return { ...estado, nombre: 'Listo para retirar', texto: 'Ya podés pasar a buscar tu pedido por el local.' }
  if (estado.id === 'delivered') return { ...estado, nombre: 'Pedido retirado', titulo: '¡Retiraste tu pedido!' }
  return estado
})

function Icono({ nombre }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{nombre}</span>
}

function InicioDemo() {
  const [busqueda, setBusqueda] = useState('')
  const consulta = busqueda.trim().toLocaleLowerCase('es-AR')
  const locales = comerciosDemo.filter(({ local }) => `${local.nombre} ${local.categoriaNombre}`.toLocaleLowerCase('es-AR').includes(consulta))

  return (
    <div className="cd-app capta-demo-inicio">
      <header className="cd-cabecera">
        <a className="cd-marca" href={DEMO} aria-label="Capta Delivery">
          <img className="cd-marca-logo" src="/capta/logo-3d.webp" alt="" width="56" height="56" />
          <span><strong>Capta</strong><em>Delivery</em></span>
        </a>
        <span className="capta-demo-etiqueta">Demo</span>
      </header>
      <main>
        <section className="capta-demo-portada">
          <div>
            <h1>Probá Capta Delivery</h1>
            <p>Elegí un local, armá tu carrito y seguí un pedido de prueba.</p>
          </div>
          <img src="/capta/logo-3d.webp" width="96" height="96" alt="" />
        </section>
        <div className="cd-buscador capta-demo-buscador">
          <Icono nombre="search" />
          <input type="search" aria-label="Buscar un comercio" placeholder="Buscá un comercio"
            value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
        </div>
        <section className="cd-seccion cd-locales-inicio" aria-labelledby="demo-abiertos">
          <div className="cd-seccion-cabeza"><h2 id="demo-abiertos">Abiertos ahora</h2></div>
          {locales.length ? (
            <SliderComercios cantidad={locales.length}>
              {locales.map(({ local }) => (
                <TarjetaCerca key={local.slug} local={local} enLista href={`${DEMO}?local=${encodeURIComponent(local.slug)}`} />
              ))}
            </SliderComercios>
          ) : <p className="cd-hoja-texto">No encontramos un local con ese nombre.</p>}
        </section>
      </main>
    </div>
  )
}

function ComercioDemo({ local }) {
  return (
    <div className="capta-demo-comercio">
      <img src={local.logo} alt="" width="44" height="44" />
      <div><strong>{local.nombre}</strong><small>Pedido #DEMO-001</small></div>
    </div>
  )
}

function ConfirmacionDemo({ pedido, local, onSeguir }) {
  return (
    <main className="capta-demo-seguimiento capta-demo-confirmacion">
      <section className="capta-demo-panel">
        <span className="capta-demo-confirmado"><Icono nombre="check" /></span>
        <h1>¡Pedido de prueba listo!</h1>
        <p>Ya podés ver cómo cambia el seguimiento.</p>
        <ComercioDemo local={local} />
        <div className="capta-demo-total"><span>Total simulado</span><strong>{moneda.format(pedido.total)}</strong></div>
        <button className="capta-demo-accion" type="button" onClick={onSeguir}>Ver seguimiento <Icono nombre="arrow_forward" /></button>
        <a className="capta-demo-volver" href={DEMO}>Volver a empezar</a>
      </section>
    </main>
  )
}

function SeguimientoDemo({ pedido, local }) {
  const pasos = pedido.retiro ? estadosRetiro : estados
  const [indice, setIndice] = useState(0)
  const [horas, setHoras] = useState({ 0: pedido.fecha })
  const actual = pasos[indice]
  const cambiarEstado = (siguiente) => {
    setIndice(siguiente)
    setHoras((previas) => ({ ...previas, [siguiente]: Date.now() }))
  }

  return (
    <main className="capta-demo-seguimiento">
      <section className="capta-demo-panel capta-demo-controles" aria-label="Controles del seguimiento de prueba">
        <div><span className="capta-demo-etiqueta">Demo</span><a href={DEMO}>Volver a empezar</a></div>
        <label htmlFor="demo-estado">Elegí un estado</label>
        <div>
          <select id="demo-estado" value={indice} onChange={(event) => cambiarEstado(Number(event.target.value))}>
            {pasos.map((paso, i) => <option key={paso.id} value={i}>{paso.nombre}</option>)}
          </select>
          {indice < pasos.length - 1 ? (
            <button className="capta-demo-siguiente" type="button" onClick={() => cambiarEstado(indice + 1)} aria-label="Avanzar al siguiente estado">
              <Icono nombre="arrow_forward" />
            </button>
          ) : null}
        </div>
      </section>
      <section className="capta-demo-estado">
        <picture key={actual.id}>
          <source media="(prefers-reduced-motion: no-preference)" srcSet={`${MASCOTA}/${actual.id}.gif`} type="image/gif" />
          <img src={`${MASCOTA}/${actual.id}.webp`} alt="" width="553" height="309" />
        </picture>
        <div aria-live="polite">
          <h1>{actual.titulo}</h1>
          <p>{actual.texto}</p>
          <small>Última actualización <time dateTime={new Date(horas[indice]).toISOString()}>{hora.format(horas[indice])}</time></small>
        </div>
        <ComercioDemo local={local} />
      </section>
      <section className="capta-demo-panel" aria-labelledby="demo-progreso">
        <h2 id="demo-progreso">Progreso del pedido</h2>
        <ol className="capta-demo-progreso">
          {pasos.map((paso, i) => (
            <li key={paso.id} data-etapa={i < indice ? 'completo' : i === indice ? 'actual' : 'pendiente'} aria-current={i === indice ? 'step' : undefined}>
              <span className="capta-demo-icono-estado"><Icono nombre={i < indice ? 'check' : paso.icono} /></span>
              <div><strong>{paso.nombre}</strong><p>{paso.texto}</p></div>
              {i <= indice && horas[i] ? <time dateTime={new Date(horas[i]).toISOString()}>{hora.format(horas[i])}</time> : null}
            </li>
          ))}
        </ol>
      </section>
      <section className="capta-demo-panel" aria-labelledby="demo-detalle">
        <h2 id="demo-detalle">Detalle del pedido</h2>
        <dl className="capta-demo-detalle">
          {pedido.lineas.map(({ name, quantity, unitPrice, notes }, i) => (
            <div key={i}><dt>{quantity} × {name}{notes ? <small>{notes}</small> : null}</dt><dd>{moneda.format(quantity * unitPrice)}</dd></div>
          ))}
          <div><dt>{pedido.retiro ? 'Retiro en el local' : 'Costo de envío'}</dt><dd>{pedido.retiro ? 'Sin costo' : moneda.format(pedido.envio)}</dd></div>
          {pedido.entreCalles ? <div><dt>Entre calles</dt><dd className="capta-demo-referencia">{pedido.entreCalles}</dd></div> : null}
          <div><dt>Pago simulado</dt><dd>Efectivo</dd></div>
          <div className="capta-demo-total"><dt>Total simulado</dt><dd>{moneda.format(pedido.total)}</dd></div>
        </dl>
      </section>
    </main>
  )
}

export default function DemoCapta() {
  const [comercio] = useState(() => {
    const slug = new URLSearchParams(window.location.search).get('local')
    return comerciosDemo.find(({ local }) => local.slug === slug)
  })
  const [pedido, setPedido] = useState(null)
  const [siguiendo, setSiguiendo] = useState(false)

  useEffect(() => {
    if (pedido) window.scrollTo(0, 0)
  }, [pedido, siguiendo])

  if (!comercio) return <InicioDemo />
  if (siguiendo) return <SeguimientoDemo pedido={pedido} local={comercio.local} />
  if (pedido) return <ConfirmacionDemo pedido={pedido} local={comercio.local} onSeguir={() => setSiguiendo(true)} />
  return (
    <>
      <div className="capta-demo-cinta">Demo de Capta Delivery <span>·</span> Pedido simulado</div>
      <Suspense fallback={<main className="capta-demo-seguimiento"><p role="status">Cargando el menú…</p></main>}>
        <MenuApp demo={comercio} onDemoConfirmar={setPedido} />
      </Suspense>
    </>
  )
}

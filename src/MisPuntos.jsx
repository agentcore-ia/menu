// La pantalla "Mis puntos" de Capta Delivery: una pagina completa que se abre
// encima de la vitrina (la barra de abajo queda a la vista).
//
// Los puntos se consultan con el celular, que es lo unico que identifica a un
// cliente en todo el sistema: no hay cuenta ni contrasena. El numero queda
// guardado en ESTE telefono y, si ya esta guardado, el saldo aparece solo.
//
// Poco texto a proposito: el saldo grande, una barra hacia el canje y tres pasos
// con iconos. Las clases empiezan con cp- (estilos en MisPuntos.css).
import { useEffect, useState } from 'react'
import './MisPuntos.css'

/** Cuenta de 0 hasta el valor, para que el saldo "suba" al aparecer. */
function useContador(meta) {
  const [valor, setValor] = useState(0)
  useEffect(() => {
    const destino = Number(meta) || 0
    let cuadro = 0
    const inicio = performance.now()
    const paso = (ahora) => {
      const avance = Math.min(1, (ahora - inicio) / 900)
      setValor(Math.round(destino * (1 - (1 - avance) ** 3)))
      if (avance < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [meta])
  return valor
}

const TRAZO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }

function Estrella({ tamano = 30 }) {
  return (
    <svg viewBox="0 0 24 24" width={tamano} height={tamano} aria-hidden="true">
      <path
        d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Icono({ nombre, tamano = 26 }) {
  const comunes = { viewBox: '0 0 24 24', width: tamano, height: tamano, 'aria-hidden': true }
  if (nombre === 'pedi') {
    return (
      <svg {...comunes}>
        <path d="M5 8h14l-1.2 11a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z" {...TRAZO} />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" {...TRAZO} />
      </svg>
    )
  }
  if (nombre === 'suma') return <Estrella tamano={tamano} />
  if (nombre === 'canjea') {
    return (
      <svg {...comunes}>
        <rect x="4" y="10" width="16" height="10" rx="2" {...TRAZO} />
        <path d="M3 7h18v3H3zM12 7v13" {...TRAZO} />
        <path d="M12 7C10.6 3.600 7 4 7.400 5.900 7.700 7 9.500 7 12 7zM12 7c1.400-3.400 5-3 4.600-1.100C16.300 7 14.500 7 12 7z" {...TRAZO} />
      </svg>
    )
  }
  if (nombre === 'copa') {
    return (
      <svg {...comunes}>
        <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1.500A3 3 0 0 0 8 10.500M16 6h3v1.500a3 3 0 0 1-3 3M12 13v4M8.500 20h7M10 17h4v3h-4z" {...TRAZO} />
      </svg>
    )
  }
  if (nombre === 'reloj') {
    return (
      <svg {...comunes}>
        <circle cx="12" cy="12" r="8.500" {...TRAZO} />
        <path d="M12 7.500V12l3 2" {...TRAZO} />
      </svg>
    )
  }
  if (nombre === 'volver') {
    return (
      <svg {...comunes}>
        <path d="M15 5l-7 7 7 7" {...TRAZO} strokeWidth={2.4} />
      </svg>
    )
  }
  if (nombre === 'ayuda') {
    return (
      <svg {...comunes}>
        <circle cx="12" cy="12" r="9" fill="currentColor" />
        <path d="M9.700 9.600a2.400 2.400 0 1 1 3.400 2.200c-.700.400-1.100.900-1.100 1.700M12 16.600v.1" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg {...comunes}>
      <path d="M9 6l6 6-6 6" {...TRAZO} strokeWidth={2.4} />
    </svg>
  )
}

export default function MisPuntos({
  onCerrar,
  pesos,
  celularInicial,
  celularValido,
  normalizarCelular,
  alGuardarCelular,
}) {
  const [celular, setCelular] = useState(celularInicial)
  const [consultado, setConsultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [ayuda, setAyuda] = useState(false)
  const [verTodo, setVerTodo] = useState(false)

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
      setConsultado(await respuesta.json())
      alGuardarCelular(numero)
    } catch {
      setError('No pudimos consultar tus puntos. Probá de nuevo en un rato.')
    } finally {
      setCargando(false)
    }
  }

  // Con el celular ya guardado, el saldo aparece sin tocar nada.
  useEffect(() => {
    if (!celularValido(celularInicial)) return undefined
    const espera = setTimeout(() => void buscar(celularInicial), 0)
    return () => clearTimeout(espera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape cierra, y la vitrina de atras no se mueve mientras esta abierta.
  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = antes
    }
  }, [onCerrar])

  const config = consultado?.config ?? null
  const activo = config?.activo === true
  const conSaldo = Boolean(consultado) && activo
  const puntos = Number(consultado?.puntos) || 0
  const contados = useContador(conSaldo ? puntos : 0)
  const minimo = Number(config?.minimoParaCanjear) || 0
  const puedeCanjear = conSaldo && puntos >= minimo
  const avance = minimo > 0 ? Math.min(100, Math.round((puntos / minimo) * 100)) : 100
  const movimientos = consultado?.movimientos ?? []
  const visibles = verTodo ? movimientos : movimientos.slice(0, 3)

  return (
    <div className="cp-pagina" role="dialog" aria-modal="true" aria-label="Mis puntos">
      <header className="cp-cabecera">
        <button type="button" className="cp-volver" onClick={onCerrar} aria-label="Volver">
          <Icono nombre="volver" tamano={24} />
        </button>
        <div className="cp-cabecera-texto">
          <h1>
            Mis puntos <span aria-hidden="true">✨</span>
          </h1>
          <p>Comprá, acumulá y canjeá</p>
        </div>
        <button type="button" className="cp-ayuda" onClick={() => setAyuda((v) => !v)} aria-expanded={ayuda}>
          <Icono nombre="ayuda" tamano={22} />
          Cómo funciona
        </button>
      </header>

      {ayuda ? (
        <ul className="cp-ayuda-panel">
          <li>
            <Icono nombre="pedi" tamano={20} /> Pedís por Capta Delivery
          </li>
          <li>
            <Icono nombre="suma" tamano={20} /> Cuando te llega el pedido, sumás puntos
          </li>
          <li>
            <Icono nombre="canjea" tamano={20} /> Los usás como descuento en tu próximo pedido
          </li>
        </ul>
      ) : null}

      <section className="cp-hero">
        <div className="cp-hero-saldo">
          <span className="cp-medalla">
            <Estrella tamano={30} />
          </span>
          <div>
            <p className="cp-etiqueta">Tus puntos</p>
            <p className="cp-numero">{conSaldo ? contados : '—'}</p>
          </div>
        </div>
        <p className="cp-pesos">{conSaldo ? `= ${pesos(consultado.pesos)} para usar` : 'Ingresá tu celular'}</p>

        {conSaldo ? (
          <div className="cp-avance">
            {puedeCanjear ? (
              <p className="cp-listo">¡Ya podés canjear!</p>
            ) : (
              <>
                <div className="cp-avance-barra">
                  <span style={{ width: `${avance}%` }} />
                </div>
                <small>
                  {puntos} / {minimo} para canjear
                </small>
              </>
            )}
          </div>
        ) : null}
      </section>

      {!conSaldo ? (
        <form
          className="cp-form"
          onSubmit={(evento) => {
            evento.preventDefault()
            void buscar(celular)
          }}
        >
          <input
            type="tel"
            inputMode="tel"
            value={celular}
            onChange={(evento) => setCelular(evento.target.value)}
            placeholder="Tu celular · 2346 587122"
            aria-label="Tu celular"
          />
          <button type="submit" disabled={cargando}>
            {cargando ? 'Buscando…' : 'Ver mis puntos'}
          </button>
          {error ? <p className="cp-error">{error}</p> : null}
          {consultado && !activo ? <p className="cp-error">Los puntos de Capta todavía no están habilitados.</p> : null}
        </form>
      ) : null}

      <ol className="cp-pasos">
        <li>
          <span className="cp-paso-icono">
            <Icono nombre="pedi" />
          </span>
          <strong>Pedí</strong>
          <small>por Capta</small>
          <i className="cp-flecha">
            <Icono nombre="mas" tamano={18} />
          </i>
        </li>
        <li>
          <span className="cp-paso-icono">
            <Icono nombre="suma" />
          </span>
          <strong>Sumá</strong>
          <small>{config ? `1 punto cada ${pesos(config.pesosPorPunto)}` : 'puntos'}</small>
          <i className="cp-flecha">
            <Icono nombre="mas" tamano={18} />
          </i>
        </li>
        <li>
          <span className="cp-paso-icono">
            <Icono nombre="canjea" />
          </span>
          <strong>Canjeá</strong>
          <small>{config ? `desde ${config.minimoParaCanjear} puntos` : 'descuentos'}</small>
          <i className="cp-flecha">
            <Icono nombre="mas" tamano={18} />
          </i>
        </li>
      </ol>

      {conSaldo ? (
        <p className="cp-tope">
          <span className="cp-tope-icono">
            <Icono nombre="copa" tamano={30} />
          </span>
          <strong>Hasta {pesos(config.topePorPedido)} de descuento por pedido</strong>
        </p>
      ) : null}

      {conSaldo ? (
        <section className="cp-historial">
          <div className="cp-historial-cabecera">
            <h2>
              <Icono nombre="reloj" tamano={26} /> Tu historial
            </h2>
            {movimientos.length > 3 ? (
              <button type="button" onClick={() => setVerTodo((v) => !v)}>
                {verTodo ? 'Ver menos' : 'Ver todo'} ›
              </button>
            ) : null}
          </div>
          {visibles.length ? (
            <ul className="cp-movimientos">
              {visibles.map((m, i) => (
                <li key={`${m.creado_at}-${i}`}>
                  <span className={`cp-mov-icono ${m.puntos < 0 ? 'cp-mov-resta' : 'cp-mov-suma'}`}>
                    {m.puntos < 0 ? '−' : '+'}
                  </span>
                  <div>
                    <strong>
                      {m.tipo === 'canje'
                        ? 'Usaste puntos'
                        : m.tipo === 'gana'
                          ? 'Sumaste'
                          : m.tipo === 'regalo'
                            ? '¡Te regalamos puntos!'
                            : 'Ajuste'}
                    </strong>
                    <small>{m.detalle || ''}</small>
                  </div>
                  <b className={m.puntos < 0 ? 'cp-resta' : 'cp-suma'}>
                    {m.puntos > 0 ? '+' : ''}
                    {m.puntos}
                  </b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cp-vacio">
              <span className="cp-vacio-icono">
                <Estrella tamano={26} />
              </span>
              Hacé tu primer pedido y empezás a sumar puntos
            </p>
          )}
          <button type="button" className="cp-cambiar" onClick={() => setConsultado(null)}>
            Consultar otro celular
          </button>
        </section>
      ) : null}
    </div>
  )
}

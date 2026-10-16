// La pantalla "Mis puntos" de Capta Delivery (hoja que sube desde abajo).
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

function IconoPaso({ nombre }) {
  const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (nombre === 'pedi') {
    return (
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path d="M5 8h14l-1.2 11a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z" {...trazo} />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" {...trazo} />
      </svg>
    )
  }
  if (nombre === 'suma') return <Estrella tamano={26} />
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2" {...trazo} />
      <path d="M3 7h18v3H3zM12 7v13" {...trazo} />
      <path d="M12 7C10.6 3.6 7 4 7.4 5.9 7.700 7 9.500 7 12 7zM12 7c1.400-3.400 5-3 4.600-1.100C16.300 7 14.500 7 12 7z" {...trazo} />
    </svg>
  )
}

export default function MisPuntos({
  Hoja,
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

  const config = consultado?.config ?? null
  const activo = config?.activo === true
  const puntos = Number(consultado?.puntos) || 0
  const contados = useContador(activo ? puntos : 0)
  const minimo = Number(config?.minimoParaCanjear) || 0
  const puedeCanjear = activo && puntos >= minimo
  const avance = minimo > 0 ? Math.min(100, Math.round((puntos / minimo) * 100)) : 100
  const conSaldo = Boolean(consultado) && activo

  return (
    <Hoja titulo="Mis puntos" onCerrar={onCerrar} clase="cd-hoja-puntos">
      <section className={`cp-hero${conSaldo ? ' cp-hero-saldo' : ''}`}>
        <i className="cp-brillo cp-brillo-1" aria-hidden="true" />
        <i className="cp-brillo cp-brillo-2" aria-hidden="true" />
        <i className="cp-chispa cp-chispa-1" aria-hidden="true" />
        <i className="cp-chispa cp-chispa-2" aria-hidden="true" />
        <span className="cp-medalla">
          <Estrella tamano={34} />
        </span>

        {conSaldo ? (
          <>
            <p className="cp-etiqueta">Tus puntos</p>
            <p className="cp-numero">{contados}</p>
            <p className="cp-pesos">= {pesos(consultado.pesos)} para usar</p>
            {puedeCanjear ? (
              <p className="cp-listo">¡Ya podés canjear!</p>
            ) : (
              <div className="cp-avance">
                <div className="cp-avance-barra">
                  <span style={{ width: `${avance}%` }} />
                </div>
                <small>
                  {puntos} / {minimo} para canjear
                </small>
              </div>
            )}
            <button type="button" className="cp-cambiar" onClick={() => setConsultado(null)}>
              Otro celular
            </button>
          </>
        ) : (
          <>
            <p className="cp-titulo">Pedí, sumá, canjeá</p>
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
            </form>
            {error ? <p className="cp-error">{error}</p> : null}
          </>
        )}
      </section>

      {consultado && !activo ? <p className="cp-vacio">Los puntos de Capta todavía no están habilitados.</p> : null}

      {!consultado || activo ? (
        <ol className="cp-pasos">
          <li>
            <span className="cp-paso-icono">
              <IconoPaso nombre="pedi" />
            </span>
            <strong>Pedí</strong>
            <small>por Capta</small>
          </li>
          <li>
            <span className="cp-paso-icono">
              <IconoPaso nombre="suma" />
            </span>
            <strong>Sumá</strong>
            <small>{config ? `1 punto cada ${pesos(config.pesosPorPunto)}` : 'puntos'}</small>
          </li>
          <li>
            <span className="cp-paso-icono">
              <IconoPaso nombre="canjea" />
            </span>
            <strong>Canjeá</strong>
            <small>{config ? `desde ${config.minimoParaCanjear} puntos` : 'descuentos'}</small>
          </li>
        </ol>
      ) : null}

      {conSaldo ? (
        <>
          <p className="cp-nota">Hasta {pesos(config.topePorPedido)} por pedido · el descuento lo paga Capta</p>

          <h3 className="cp-subtitulo">Tu historial</h3>
          {consultado.movimientos?.length ? (
            <ul className="cp-movimientos">
              {consultado.movimientos.map((m, i) => (
                <li key={`${m.creado_at}-${i}`}>
                  <span className={`cp-mov-icono ${m.puntos < 0 ? 'cp-mov-resta' : 'cp-mov-suma'}`}>
                    {m.puntos < 0 ? '−' : '+'}
                  </span>
                  <div>
                    <strong>{m.tipo === 'canje' ? 'Usaste puntos' : m.tipo === 'gana' ? 'Sumaste' : 'Ajuste'}</strong>
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
            <p className="cp-vacio">Hacé tu primer pedido y empezás a sumar ⭐</p>
          )}
        </>
      ) : null}
    </Hoja>
  )
}

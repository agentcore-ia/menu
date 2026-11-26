// La ruleta de bienvenida de Capta Delivery: le aparece una vez a la cuenta nueva.
//
// Si le toca girar, y en que gajo cae, lo decide el servidor (dashboard, lib/server/ruletaCapta.ts).
// Aca solo se pregunta, se dibuja la rueda y se la anima hasta ese gajo. Si algo falla no se muestra
// nada: nunca puede estorbar para pedir.

import { useEffect, useRef, useState } from 'react'
import { pedirCuenta } from './sesionCapta.js'
import { anguloParaGajo } from '../shared/ruleta.js'
import './ruleta-capta.css'

const COLORES = ['#ff6a00', '#fff1e6', '#ffc400', '#ffe0cc']
const DURACION_MS = 4800

function punto(grados, radio) {
  const r = (grados * Math.PI) / 180
  return [100 + radio * Math.sin(r), 100 - radio * Math.cos(r)]
}

function Rueda({ gajos, angulo, onFrenar }) {
  const n = gajos.length
  const paso = 360 / n
  return (
    <div className="rl-rueda">
      <span className="rl-flecha" aria-hidden="true" />
      <svg
        viewBox="0 0 200 200"
        className="rl-disco"
        style={{ transform: `rotate(${angulo}deg)`, transitionDuration: `${DURACION_MS}ms` }}
        onTransitionEnd={onFrenar}
        role="img"
        aria-label={`Ruleta con: ${gajos.map((g) => g.etiqueta).join(', ')}`}
      >
        {gajos.map((g, i) => {
          const [x1, y1] = punto(i * paso, 97)
          const [x2, y2] = punto((i + 1) * paso, 97)
          // Con cinco o nueve gajos, el ultimo no puede repetir el color del primero.
          const indiceColor = i === n - 1 && n % COLORES.length === 1 ? 1 : i % COLORES.length
          return (
            <g key={`${g.etiqueta}-${i}`}>
              <path d={`M100 100 L${x1} ${y1} A97 97 0 ${paso > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={COLORES[indiceColor]} stroke="#fff" strokeWidth="1.5" />
              <text
                transform={`rotate(${(i + 0.5) * paso - 90} 100 100)`}
                x="188"
                y="103"
                textAnchor="end"
                fontSize={g.etiqueta.length > 15 ? 7 : 8.5}
                fontWeight="800"
                fill={indiceColor === 0 ? '#fff' : '#4a2410'}
              >
                {g.etiqueta}
              </text>
            </g>
          )
        })}
      </svg>
      <img className="rl-centro" src="/capta/marca/mascota.webp" alt="" width="52" height="52" />
    </div>
  )
}

/**
 * `token`: la sesion de la cuenta. `activa`: false mientras hay otro cartel arriba.
 * `onGano`: se llama cuando gano algo (para volver a pedir sus cupones).
 */
export function RuletaCapta({ token, activa = true, onGano }) {
  const [juego, setJuego] = useState(null)
  // listo -> pidiendo -> girando -> resultado
  const [fase, setFase] = useState('listo')
  const [angulo, setAngulo] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const red = useRef(null)

  useEffect(() => {
    if (!token) return undefined
    let vivo = true
    pedirCuenta('POST', { accion: 'ruleta' }, token)
      .then((datos) => {
        if (vivo && datos?.pendiente && datos.gajos?.length > 1) setJuego({ ...datos, token })
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [token])

  useEffect(() => () => clearTimeout(red.current), [])

  // Si cerro la sesion, la ruleta de esa cuenta no sigue en pantalla.
  if (!juego || juego.token !== token || !activa) return null

  const frenar = () => {
    clearTimeout(red.current)
    setFase((actual) => (actual === 'girando' ? 'resultado' : actual))
  }

  const girar = async () => {
    if (fase !== 'listo') return
    setFase('pidiendo')
    setError('')
    try {
      const r = await pedirCuenta('POST', { accion: 'girar' }, token)
      setResultado(r)
      setJuego((j) => ({ ...j, gajos: r.gajos }))
      setFase('girando')
      // Un cuadro despues, para que la rueda anime desde donde esta.
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setAngulo(anguloParaGajo(r.indice, r.gajos.length, Math.random()))))
      // Por si el navegador no avisa que termino de girar (pestaña en segundo plano).
      red.current = setTimeout(frenar, DURACION_MS + 700)
      if (r.premio) onGano?.()
    } catch (e) {
      setError(e.message)
      setFase('listo')
    }
  }

  const cerrar = () => setJuego(null)
  const premio = resultado?.premio

  return (
    <div className="rl-fondo" role="dialog" aria-modal="true" aria-label="Ruleta de bienvenida">
      <div className="rl-caja">
        <h2>{fase === 'resultado' ? (premio ? '¡Ganaste!' : 'Esta vez no salió') : juego.titulo}</h2>
        {fase !== 'resultado' && juego.mensaje ? <p className="rl-mensaje">{juego.mensaje}</p> : null}

        <Rueda gajos={juego.gajos} angulo={angulo} onFrenar={frenar} />

        {fase === 'resultado' ? (
          <div className="rl-resultado" aria-live="polite">
            {premio ? (
              <>
                <strong>{premio.texto}</strong>
                <span>{premio.titulo}</span>
                <small>{premio.donde}</small>
                <small>
                  Ya está guardado en tu cuenta: lo podés usar durante {resultado.diasValidez} días, al hacer tu pedido.
                </small>
              </>
            ) : (
              <span>No te tocó premio en este giro. ¡Gracias por sumarte a Capta!</span>
            )}
            <button type="button" className="rl-boton" onClick={cerrar}>
              {premio ? '¡Genial!' : 'Cerrar'}
            </button>
          </div>
        ) : (
          <>
            {error ? <p className="rl-error" role="alert">{error}</p> : null}
            <button type="button" className="rl-boton" onClick={() => void girar()} disabled={fase !== 'listo'}>
              {fase === 'listo' ? 'Girar la ruleta' : 'Girando…'}
            </button>
            {fase === 'listo' ? (
              <button type="button" className="rl-despues" onClick={cerrar}>
                Más tarde
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

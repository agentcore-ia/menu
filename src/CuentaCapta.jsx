// Entrar a la cuenta de Capta Delivery con el celular: se pide un codigo, llega
// por el WhatsApp de Capta y se escribe. Lo verifica el dashboard
// (/api/public/cuenta, a traves de server/cuenta.js).

import { useEffect, useState } from 'react'
import { almacenDelNavegador, leerDatos } from '../shared/datosDelCliente.js'
import { celularValido, MENSAJE_CELULAR_INVALIDO, normalizarCelular } from '../shared/celular.js'
import { celularLindo, guardarSesion, pedirCuenta } from './sesionCapta.js'

function Icono({ nombre }) {
  return (
    <span className="material-symbols-outlined cd-icono" aria-hidden="true">
      {nombre}
    </span>
  )
}

/** El paso a paso para entrar. `onListo(sesion)` cuando el codigo esta bien. */
export function Ingresar({ onListo, titulo = 'Entrá con tu celular' }) {
  const [paso, setPaso] = useState('celular')
  const [celular, setCelular] = useState(() => leerDatos(almacenDelNavegador())?.phone || '')
  const [codigo, setCodigo] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')
  const [esperar, setEsperar] = useState(0)

  // La cuenta regresiva para poder pedir otro codigo.
  useEffect(() => {
    if (esperar <= 0) return undefined
    const t = window.setTimeout(() => setEsperar((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [esperar])

  const pedirCodigo = async () => {
    setError('')
    if (!celularValido(celular)) {
      setError(MENSAJE_CELULAR_INVALIDO)
      return
    }
    setTrabajando(true)
    try {
      await pedirCuenta('POST', { accion: 'pedir_codigo', telefono: celular })
      setPaso('codigo')
      setCodigo('')
      setEsperar(60)
    } catch (e) {
      setError(e.message)
      if (e.esperarSegundos) {
        setPaso('codigo')
        setEsperar(e.esperarSegundos)
      }
    } finally {
      setTrabajando(false)
    }
  }

  const verificar = async (valor = codigo) => {
    const limpio = String(valor).replace(/\D/g, '')
    if (limpio.length !== 6) {
      setError('Escribí los 6 números del código.')
      return
    }
    setError('')
    setTrabajando(true)
    try {
      const datos = await pedirCuenta('POST', { accion: 'verificar', telefono: celular, codigo: limpio })
      const sesion = { token: datos.token, cliente: datos.cliente }
      guardarSesion(sesion)
      onListo(sesion, Boolean(datos.nuevo))
    } catch (e) {
      setError(e.message)
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <div className="cd-ingresar">
      <div className="cd-ingresar-cabeza">
        <span className="cd-ingresar-icono">
          <Icono nombre={paso === 'celular' ? 'smartphone' : 'sms'} />
        </span>
        <div>
          <strong>{paso === 'celular' ? titulo : 'Escribí el código'}</strong>
          <small>
            {paso === 'celular'
              ? 'Te mandamos un código por WhatsApp. Sin contraseñas.'
              : `Te lo mandamos por WhatsApp al ${celularLindo(normalizarCelular(celular))}.`}
          </small>
        </div>
      </div>

      {paso === 'celular' ? (
        <form
          className="cd-ingresar-form"
          onSubmit={(e) => {
            e.preventDefault()
            void pedirCodigo()
          }}
        >
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            placeholder="Tu celular, ej: 2346 587122"
            aria-label="Tu celular"
          />
          <button type="submit" disabled={trabajando}>
            {trabajando ? 'Enviando…' : 'Recibir código por WhatsApp'}
          </button>
        </form>
      ) : (
        <form
          className="cd-ingresar-form"
          onSubmit={(e) => {
            e.preventDefault()
            void verificar()
          }}
        >
          <input
            className="cd-ingresar-codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={codigo}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCodigo(v)
              // Con los 6 numeros entra solo, sin tocar el boton.
              if (v.length === 6 && !trabajando) void verificar(v)
            }}
            placeholder="••••••"
            aria-label="Código de 6 números"
            autoFocus
          />
          <button type="submit" disabled={trabajando || codigo.length !== 6}>
            {trabajando ? 'Verificando…' : 'Entrar'}
          </button>
          <div className="cd-ingresar-links">
            <button type="button" onClick={() => setPaso('celular')}>
              Cambiar número
            </button>
            <button type="button" disabled={esperar > 0 || trabajando} onClick={() => void pedirCodigo()}>
              {esperar > 0 ? `Reenviar en ${esperar} s` : 'Reenviar código'}
            </button>
          </div>
        </form>
      )}

      {error ? <p className="cd-puntos-error">{error}</p> : null}
    </div>
  )
}

/** Su nombre, editable. */
export function NombreDeLaCuenta({ sesion, onCambio }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(sesion.cliente?.nombre || '')
  const [error, setError] = useState('')

  const guardar = async () => {
    setError('')
    try {
      const datos = await pedirCuenta('POST', { accion: 'actualizar', nombre }, sesion.token)
      const nueva = { ...sesion, cliente: datos.cliente || { ...sesion.cliente, nombre } }
      guardarSesion(nueva)
      onCambio(nueva)
      setEditando(false)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="cd-cuenta-cabeza">
      <span className="cd-cuenta-avatar">{(sesion.cliente?.nombre || '?').trim().charAt(0).toUpperCase() || '?'}</span>
      <div className="cd-cuenta-textos">
        {editando ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void guardar()
            }}
          >
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} placeholder="Tu nombre" autoFocus />
            <button type="submit">Guardar</button>
          </form>
        ) : (
          <button type="button" className="cd-cuenta-nombre" onClick={() => setEditando(true)}>
            {sesion.cliente?.nombre || 'Poné tu nombre'}
            <Icono nombre="edit" />
          </button>
        )}
        <small>{celularLindo(sesion.cliente?.telefono)} · verificado</small>
        {error ? <p className="cd-puntos-error">{error}</p> : null}
      </div>
    </div>
  )
}

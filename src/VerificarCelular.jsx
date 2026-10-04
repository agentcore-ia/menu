// Verificar el celular sin salir del pedido, para poder usar los puntos de
// Capta (el servidor no deja usarlos sin esto: supabaseOrderRepository.js).
// Es el mismo ingreso de menu.net.ar/pedi (codigo por WhatsApp), con el
// celular que el cliente ya escribio en el pedido.

import { useEffect, useState } from 'react'
import { guardarSesion, pedirCuenta } from './sesionCapta.js'

export function VerificarCelular({ telefono, onVerificado }) {
  const [paso, setPaso] = useState('inicio')
  const [codigo, setCodigo] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')
  const [esperar, setEsperar] = useState(0)

  useEffect(() => {
    if (esperar <= 0) return undefined
    const t = window.setTimeout(() => setEsperar((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [esperar])

  const pedirCodigo = async () => {
    setError('')
    setTrabajando(true)
    try {
      await pedirCuenta('POST', { accion: 'pedir_codigo', telefono })
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

  const verificar = async (valor) => {
    setError('')
    setTrabajando(true)
    try {
      const datos = await pedirCuenta('POST', { accion: 'verificar', telefono, codigo: valor })
      const sesion = { token: datos.token, cliente: datos.cliente }
      guardarSesion(sesion)
      onVerificado(sesion)
    } catch (e) {
      setError(e.message)
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <div className="capta-verificar">
      {paso === 'inicio' ? (
        <>
          <p>Para usar tus puntos, verificá que este celular es tuyo. Te mandamos un código por WhatsApp.</p>
          <button type="button" disabled={trabajando} onClick={() => void pedirCodigo()}>
            {trabajando ? 'Enviando…' : 'Verificar con WhatsApp'}
          </button>
        </>
      ) : (
        <>
          <p>Escribí el código de 6 números que te llegó por WhatsApp.</p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCodigo(v)
              if (v.length === 6 && !trabajando) void verificar(v)
            }}
            placeholder="••••••"
            aria-label="Código de 6 números"
          />
          <button type="button" className="capta-verificar-link" disabled={esperar > 0 || trabajando} onClick={() => void pedirCodigo()}>
            {trabajando ? 'Verificando…' : esperar > 0 ? `Reenviar en ${esperar} s` : 'Reenviar código'}
          </button>
        </>
      )}
      {error ? <p className="capta-verificar-error">{error}</p> : null}
    </div>
  )
}

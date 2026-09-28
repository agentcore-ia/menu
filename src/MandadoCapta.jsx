// Los mandados de Capta Delivery en la vitrina: "comprame algo" o "llevá este
// paquete", como los Favores de Rappi.
//
// Los mandados son de Capta, no de un local: los cotiza, crea y despacha el
// dashboard, con las zonas de Capta de la ciudad. Esta pantalla habla con
// /api/delivery/mandados (server/mandados.js), que busca la direccion y le
// pasa todo al dashboard. No decide plata: el precio lo pone el servidor.

import { useState } from 'react'
import { TIPOS_MANDADO, normalizarMandado } from '../shared/mandados.js'
import {
  almacenDelNavegador,
  coordenadasGuardadas,
  guardarDatos,
  leerDatos,
} from '../shared/datosDelCliente.js'
import { celularValido, MENSAJE_CELULAR_INVALIDO, normalizarCelular } from '../shared/celular.js'

function pesos(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)
}

function Icono({ nombre }) {
  return (
    <span className="material-symbols-outlined cd-icono" aria-hidden="true">
      {nombre}
    </span>
  )
}

/** La tarjeta de la vitrina que abre el formulario. */
export function EntradaMandados({ mandado, onAbrir }) {
  return (
    <button type="button" className="cd-mandados-entrada" onClick={onAbrir}>
      <span className="cd-mandados-icono">
        <Icono nombre="directions_bike" />
      </span>
      <span className="cd-mandados-textos">
        <strong>Mandados</strong>
        <small>
          Te compramos lo que necesites o llevamos tu paquete
          {mandado.envioDesde ? ` · envío desde ${pesos(mandado.envioDesde)}` : ''}
        </small>
      </span>
      <Icono nombre="chevron_right" />
    </button>
  )
}

/**
 * Cotiza el envio con las zonas de Capta de la ciudad. Sin punto, busca la
 * direccion cerca del centro de la ciudad y devuelve las opciones con su precio.
 */
async function cotizar(mandado, { direccion, barrio, punto }) {
  const params = new URLSearchParams({ accion: 'cotizar', address: direccion, neighborhood: barrio, city: mandado.ciudad })
  if (punto) {
    params.set('lat', String(punto.lat))
    params.set('lng', String(punto.lng))
    if (punto.label) params.set('label', String(punto.label))
  } else if (mandado.centro) {
    params.set('olat', String(mandado.centro.lat))
    params.set('olng', String(mandado.centro.lng))
  }
  const respuesta = await fetch(`/api/delivery/mandados?${params}`, { cache: 'no-store' })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw new Error(datos?.message || 'No pudimos calcular el envío a esa dirección.')
  return datos
}

export function FormularioMandado({ mandado }) {
  const ciudad = mandado.ciudad
  const [guardados] = useState(() => leerDatos(almacenDelNavegador()))
  const [tipo, setTipo] = useState('compra')
  const [que, setQue] = useState('')
  const [donde, setDonde] = useState('')
  const [tope, setTope] = useState('')
  const [contacto, setContacto] = useState('')
  const [pagaEn, setPagaEn] = useState('entrega')
  const [nota, setNota] = useState('')
  const [nombre, setNombre] = useState(guardados?.name || '')
  const [celular, setCelular] = useState(guardados?.phone || '')
  const [direccion, setDireccion] = useState(guardados?.address || '')
  const [barrio, setBarrio] = useState(guardados?.neighborhood || '')

  // La cotizacion del envio: null (sin pedir), { opciones } (elegir de la
  // lista) o la respuesta con allowed/fee.
  const [envio, setEnvio] = useState(null)
  const [cotizando, setCotizando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(null)

  // Cambiar la direccion invalida lo cotizado: era para otra puerta.
  const cambiarDireccion = (setter) => (evento) => {
    setter(evento.target.value)
    setEnvio(null)
  }

  const pedirCotizacion = async (punto = null) => {
    if (direccion.trim().length < 4 && !punto) {
      setError('Escribí calle y altura de donde lo tenemos que llevar.')
      return
    }
    setError('')
    setCotizando(true)
    try {
      const guardado = punto || coordenadasGuardadas(guardados, { address: direccion, neighborhood: barrio }, ciudad)
      const datos = await cotizar(mandado, { direccion: direccion.trim(), barrio: barrio.trim(), punto: guardado })
      setEnvio(datos)
    } catch (e) {
      setEnvio(null)
      setError(e instanceof Error ? e.message : 'No pudimos calcular el envío.')
    } finally {
      setCotizando(false)
    }
  }

  // Sin precio y sin punto no sale: el envio lo cobra Capta por la zona de ESE
  // punto (el servidor tiene la misma regla).
  const envioListo = envio?.allowed === true && Number(envio.fee) > 0 && envio.coordinates ? envio : null

  const enviar = async (evento) => {
    evento.preventDefault()
    setError('')

    const revisado = normalizarMandado(
      { tipo, que, donde, tope, contacto, pagaEn },
      { tope: mandado.tope },
    )
    if (!revisado.ok) {
      setError(revisado.mensaje)
      return
    }
    if (!nombre.trim()) {
      setError('Poné tu nombre.')
      return
    }
    if (!celularValido(celular)) {
      setError(MENSAJE_CELULAR_INVALIDO)
      return
    }
    if (!envioListo) {
      setError('Primero calculá el envío a tu dirección.')
      return
    }

    setEnviando(true)
    try {
      const respuesta = await fetch('/api/delivery/mandados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciudad,
          cliente: {
            nombre: nombre.trim(),
            telefono: normalizarCelular(celular),
            direccion: direccion.trim(),
            barrio: barrio.trim(),
          },
          mandado: revisado.mandado,
          punto: envioListo.coordinates,
          notas: nota.trim(),
        }),
      })
      const datos = await respuesta.json().catch(() => null)
      if (!respuesta.ok) throw new Error(datos?.message || 'No pudimos mandar el pedido. Probá de nuevo.')

      guardarDatos(
        almacenDelNavegador(),
        { name: nombre, phone: celular, address: direccion, neighborhood: barrio, deliveryType: 'delivery' },
        { ciudad, coordenadas: envioListo.coordinates },
      )
      setListo({ numero: datos?.numero, total: datos?.envio || envioListo.fee, mandado: revisado.mandado })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos mandar el pedido.')
    } finally {
      setEnviando(false)
    }
  }

  if (listo) {
    return (
      <div className="cd-mandado-listo">
        <span className="cd-mandados-icono cd-mandados-icono-grande">
          <Icono nombre="check" />
        </span>
        <h3>¡Listo! Ya lo están viendo los repartidores</h3>
        <p>
          Mandado {listo.numero ? `#${listo.numero}` : ''} · te escribimos por WhatsApp cuando salga.
        </p>
        <p className="cd-mandado-cuenta">
          {listo.mandado.tipo === 'compra'
            ? `Al recibir pagás en efectivo el envío (${pesos(listo.total)}) + lo que salga la compra, con el ticket.`
            : `El envío (${pesos(listo.total)}) se paga en efectivo al ${listo.mandado.pagaEn === 'retiro' ? 'retirar' : 'entregar'}.`}
        </p>
      </div>
    )
  }

  return (
    <form className="cd-mandado-form" onSubmit={enviar} noValidate>
      <div className="cd-mandado-tipos" role="radiogroup" aria-label="Qué necesitás">
        {TIPOS_MANDADO.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={tipo === t.id}
            className={tipo === t.id ? 'cd-mandado-tipo cd-mandado-tipo-activo' : 'cd-mandado-tipo'}
            onClick={() => setTipo(t.id)}
          >
            <Icono nombre={t.id === 'compra' ? 'shopping_bag' : 'package_2'} />
            <strong>{t.label}</strong>
            <small>{t.detalle}</small>
          </button>
        ))}
      </div>

      <label>
        <span>{tipo === 'compra' ? '¿Qué hay que comprar?' : '¿Qué hay que llevar?'}</span>
        <textarea
          value={que}
          onChange={(e) => setQue(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={
            tipo === 'compra'
              ? 'Ej: un cargador tipo C y una gaseosa de 1,5 L'
              : 'Ej: unas llaves en un sobre'
          }
        />
      </label>

      <label>
        <span>{tipo === 'compra' ? '¿Dónde? (opcional)' : '¿Dónde lo retiramos?'}</span>
        <input
          value={donde}
          onChange={(e) => setDonde(e.target.value)}
          maxLength={200}
          placeholder={tipo === 'compra' ? 'Ej: kiosco de Moreno y Rivadavia' : 'Calle y altura'}
        />
      </label>

      {tipo === 'compra' ? (
        <label>
          <span>¿Hasta cuánto puede salir la compra?</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max={mandado.tope}
            value={tope}
            onChange={(e) => setTope(e.target.value)}
            placeholder={`Hasta ${pesos(mandado.tope)}`}
          />
          <small className="cd-mandado-ayuda">
            El repartidor la paga y vos se la devolvés al recibir, con el ticket.
          </small>
        </label>
      ) : (
        <>
          <label>
            <span>¿A quién le pedimos el paquete? (opcional)</span>
            <input
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              maxLength={120}
              placeholder="Nombre y celular"
            />
          </label>
          <div className="cd-mandado-pagaen" role="radiogroup" aria-label="Cuándo se paga el envío">
            <span>El envío se paga</span>
            {[
              ['entrega', 'Al entregar'],
              ['retiro', 'Al retirar'],
            ].map(([id, texto]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={pagaEn === id}
                className={pagaEn === id ? 'cd-chip cd-chip-activo' : 'cd-chip'}
                onClick={() => setPagaEn(id)}
              >
                {texto}
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="cd-mandado-subtitulo">{tipo === 'compra' ? '¿A dónde te lo llevamos?' : '¿A dónde lo llevamos?'}</h3>

      <label>
        <span>Tu nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} autoComplete="name" />
      </label>
      <label>
        <span>Tu celular</span>
        <input
          type="tel"
          inputMode="tel"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
          placeholder="Ej: 2346 587122"
          autoComplete="tel"
        />
      </label>
      <label>
        <span>Dirección de entrega</span>
        <input
          value={direccion}
          onChange={cambiarDireccion(setDireccion)}
          placeholder="Calle y altura"
          autoComplete="street-address"
        />
      </label>
      <label>
        <span>Barrio o referencia (opcional)</span>
        <input value={barrio} onChange={cambiarDireccion(setBarrio)} maxLength={80} />
      </label>

      {envio?.needsConfirmation && envio.candidates?.length ? (
        <div className="cd-mandado-opciones">
          <p>¿Cuál es tu dirección?</p>
          {envio.candidates.map((c) => (
            <button key={c.id ?? c.label} type="button" disabled={cotizando} onClick={() => void pedirCotizacion(c.coordinates)}>
              <span>{c.label}</span>
              <small>{c.allowed ? pesos(c.fee) : 'Fuera de zona'}</small>
            </button>
          ))}
        </div>
      ) : null}

      {envioListo ? (
        <p className="cd-mandado-envio">
          <span>Envío{envioListo.zone?.name ? ` · ${envioListo.zone.name}` : ''}</span>
          <strong>{pesos(envioListo.fee)}</strong>
        </p>
      ) : envio && !envio.needsConfirmation && envio.allowed === false ? (
        <p className="cd-puntos-error">{envio.message || 'Esa dirección está fuera de la zona de envío.'}</p>
      ) : null}

      {!envioListo ? (
        <button type="button" className="cd-mandado-secundario" disabled={cotizando} onClick={() => void pedirCotizacion()}>
          {cotizando ? 'Calculando…' : 'Calcular el envío'}
        </button>
      ) : null}

      <label>
        <span>Algo más que tengamos que saber (opcional)</span>
        <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} placeholder="Ej: tocar timbre 2B" />
      </label>

      {error ? <p className="cd-puntos-error">{error}</p> : null}

      <p className="cd-mandado-cuenta">
        {tipo === 'compra'
          ? 'Pagás al recibir, en efectivo: la compra (con el ticket) + el envío.'
          : `El envío se paga en efectivo al ${pagaEn === 'retiro' ? 'retirar el paquete' : 'entregarlo'}.`}
      </p>

      <button type="submit" className="cd-mandado-enviar" disabled={enviando || !envioListo}>
        {enviando ? 'Enviando…' : 'Pedir el mandado'}
      </button>
    </form>
  )
}

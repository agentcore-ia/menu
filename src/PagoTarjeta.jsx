// Pago con tarjeta sin salir del menu.
//
// Los campos de la tarjeta los dibuja Mercado Pago dentro de sus propios
// iframes: el numero nunca toca el DOM de esta pagina ni viaja a un servidor
// nuestro. Lo unico que sale de aca es un token de un solo uso.
//
// Se usa el Payment Brick y no campos sueltos a proposito. El Brick resuelve
// las cuotas, el banco emisor, el DNI y —sobre todo— el desafio del banco
// (3-D Secure), que cada vez piden mas emisores y es la parte donde un
// formulario propio se rompe sin que nadie se entere.
import { useCallback, useEffect, useRef, useState } from 'react'

const SDK = 'https://sdk.mercadopago.com/js/v2'

function cargarSdk() {
  if (window.MercadoPago) return Promise.resolve(window.MercadoPago)

  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${SDK}"]`)
    if (existente) {
      existente.addEventListener('load', () => resolve(window.MercadoPago), { once: true })
      existente.addEventListener('error', () => reject(new Error('sdk')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = SDK
    script.onload = () => resolve(window.MercadoPago)
    script.onerror = () => reject(new Error('sdk'))
    document.body.appendChild(script)
  })
}

/** Lo que el cliente tiene que hacer, traducido al boton que ve. */
const BOTON = {
  corregir: 'Corregir y reintentar',
  otra_tarjeta: 'Probar con otra tarjeta',
  llamar_al_banco: 'Ya llamé, reintentar',
  reintentar: 'Reintentar',
  esperar: null,
}

export default function PagoTarjeta({
  publicKey,
  accountId,
  orderId,
  total,
  email,
  linkDeMercadoPago,
  onAprobado,
  onCerrar,
}) {
  const contenedor = useRef(null)
  const brick = useRef(null)
  const [estado, setEstado] = useState('cargando')
  const [resultado, setResultado] = useState(null)

  // Se guarda en un ref para que volver a montar el Brick no dependa de que
  // las funciones del padre sean estables: si dependiera, el formulario se
  // re-armaria en cada render y el cliente no llegaria nunca a escribir.
  const alAprobar = useRef(onAprobado)
  useEffect(() => { alAprobar.current = onAprobado }, [onAprobado])

  const cobrar = useCallback(async (formData) => {
    const respuesta = await fetch(`/api/accounts/${encodeURIComponent(accountId)}/pay-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        token: formData?.token,
        paymentMethodId: formData?.payment_method_id,
        installments: formData?.installments,
        issuerId: formData?.issuer_id ?? null,
        email: formData?.payer?.email || email,
        identificationType: formData?.payer?.identification?.type ?? null,
        identificationNumber: formData?.payer?.identification?.number ?? null,
      }),
    })

    const data = await respuesta.json().catch(() => null)
    if (!respuesta.ok) {
      // El error del servidor tambien es un resultado: el cliente tiene que
      // ver algo que pueda hacer, no una pantalla que no cambia.
      return { estado: 'rechazado', mensaje: data?.message || 'No pudimos procesar el pago.', queHacer: 'reintentar' }
    }
    return data
  }, [accountId, orderId, email])

  const montar = useCallback(async () => {
    try {
      const MercadoPago = await cargarSdk()
      if (!contenedor.current) return

      // Si habia uno montado, se saca antes: dos Bricks sobre el mismo nodo
      // dejan el formulario muerto sin decir nada.
      if (brick.current) {
        try { brick.current.unmount() } catch { /* ya no estaba */ }
        brick.current = null
      }
      contenedor.current.innerHTML = ''

      const mp = new MercadoPago(publicKey, { locale: 'es-AR' })
      brick.current = await mp.bricks().create('payment', contenedor.current.id, {
        initialization: {
          amount: Number(total) || 0,
          payer: email ? { email } : undefined,
        },
        customization: {
          // Solo tarjeta: para lo demas ya esta el link de Mercado Pago.
          paymentMethods: { creditCard: 'all', debitCard: 'all' },
          visual: { hidePaymentButton: false },
        },
        callbacks: {
          onReady: () => setEstado('listo'),
          onSubmit: async ({ formData }) => {
            setEstado('cobrando')
            const r = await cobrar(formData)
            setResultado(r)
            if (r?.estado === 'aprobado') {
              setEstado('aprobado')
              alAprobar.current?.()
            } else if (r?.estado === 'pendiente') {
              setEstado('pendiente')
            } else {
              setEstado('rechazado')
            }
          },
          onError: () => setEstado('error'),
        },
      })
    } catch {
      setEstado('error')
    }
  }, [publicKey, total, email, cobrar])

  // Volver a empezar despues de un rechazo: primero se limpia la pantalla y
  // despues se arma un formulario nuevo, porque el token de la tarjeta ya se
  // gasto y hay que pedir uno.
  const reintentar = useCallback(() => {
    setEstado('cargando')
    setResultado(null)
    void montar()
  }, [montar])

  // Montar y desmontar un widget de un tercero es justo para lo que sirve un
  // efecto. La regla ve el `setEstado` del catch y no distingue que `montar`
  // es async: nada de eso corre sincronico, todo pasa despues del primer await.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void montar()
    return () => {
      if (brick.current) {
        try { brick.current.unmount() } catch { /* ya no estaba */ }
        brick.current = null
      }
    }
  }, [montar])

  if (estado === 'aprobado') {
    return (
      <div className="pago-tarjeta pago-tarjeta-ok">
        <strong>Pago aprobado</strong>
        <p>Ya le avisamos al local. En un momento te confirman el pedido.</p>
      </div>
    )
  }

  if (estado === 'pendiente') {
    return (
      <div className="pago-tarjeta pago-tarjeta-espera">
        <strong>Falta un paso</strong>
        <p>{resultado?.mensaje || 'El pago está en proceso.'}</p>
        {resultado?.autenticacion ? (
          <a className="pago-tarjeta-accion" href={resultado.autenticacion} target="_blank" rel="noopener noreferrer">
            Confirmar con mi banco
          </a>
        ) : null}
        <button type="button" className="pago-tarjeta-secundario" onClick={onCerrar}>
          Ver mi pedido
        </button>
      </div>
    )
  }

  return (
    <div className="pago-tarjeta">
      {estado === 'error' ? (
        <div className="pago-tarjeta-aviso">
          <strong>No pudimos abrir el pago con tarjeta</strong>
          {linkDeMercadoPago ? (
            <a className="pago-tarjeta-accion" href={linkDeMercadoPago}>Pagar en Mercado Pago</a>
          ) : null}
        </div>
      ) : null}

      {resultado && estado === 'rechazado' ? (
        <div className="pago-tarjeta-aviso error">
          <strong>{resultado.mensaje}</strong>
          {BOTON[resultado.queHacer] ? (
            <button type="button" className="pago-tarjeta-accion" onClick={reintentar}>
              {BOTON[resultado.queHacer]}
            </button>
          ) : null}
          {/* La salida de emergencia siempre a la vista: si la tarjeta no
              entra, el pedido no se pierde por eso. */}
          {linkDeMercadoPago ? (
            <a className="pago-tarjeta-secundario" href={linkDeMercadoPago}>Pagar en Mercado Pago</a>
          ) : null}
        </div>
      ) : null}

      {estado === 'cargando' ? <p className="pago-tarjeta-cargando">Preparando el pago seguro…</p> : null}
      {estado === 'cobrando' ? <p className="pago-tarjeta-cargando">Procesando el pago…</p> : null}

      <div id="pago-tarjeta-brick" ref={contenedor} />
    </div>
  )
}

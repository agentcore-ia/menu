// "Envio a cargo del local": hay locales con Capta que le regalan el envio al cliente y lo pagan
// ellos. Se prende desde el panel de Capta (horarios._settings.captaEnvioPagaElLocal).
//
// El cliente ve y paga $0 de envio (pedidos.delivery_fee) y el precio de la zona queda aparte, en
// pedidos.envio_a_cargo_local: de ahi Capta cobra el viaje, descontandoselo al local.

export function envioLoPagaElLocal(ajustes) {
  return ajustes?.deliveryCapta === true && ajustes?.captaEnvioPagaElLocal === true
}

/** La cotizacion como la ve el cliente: la misma zona y las mismas opciones, sin costo. */
export function cotizacionSinCosto(cotizacion) {
  if (!cotizacion || typeof cotizacion !== 'object') return cotizacion
  const gratis = (x) => (x && typeof x === 'object' ? { ...x, ...(x.fee === undefined ? {} : { fee: 0 }) } : x)
  const salida = gratis(cotizacion)
  if (salida.zone) salida.zone = gratis(salida.zone)
  if (Array.isArray(salida.candidates)) {
    salida.candidates = salida.candidates.map((c) => ({ ...gratis(c), ...(c?.zone ? { zone: gratis(c.zone) } : {}) }))
  }
  if (Array.isArray(salida.posibles)) salida.posibles = salida.posibles.map(gratis)
  // El aviso de "hay dos zonas posibles" habla de precios que el cliente no paga.
  if (salida.posibles) delete salida.aviso
  return salida
}

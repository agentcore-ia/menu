// Si el local cobra por transferencia en el menu, y con que datos.
//
// La decide el INTERRUPTOR de Ajustes > Datos para transferencia. Antes
// alcanzaba con tener un alias cargado: Babson apago la transferencia y el menu
// la seguia ofreciendo porque el alias seguia ahi (28/09/2026). Apagarla y
// dejar los datos guardados es lo normal (para prenderla otra vez sin volver a
// escribirlos), asi que los datos solos no pueden decidir.
//
// La usan el armado del menu (que mostrar) y la creacion del pedido (que
// aceptar): un pedido armado a mano o desde una pestaña vieja no la saltea.
//
//   node --test shared/transferencia.test.mjs

const texto = (v) => String(v ?? '').trim()

/**
 * Los datos para transferir, o null si el local no cobra por transferencia.
 *
 * Hacen falta las dos cosas: el interruptor prendido y un alias o CBU/CVU.
 * Prendido sin datos no sirve: el cliente elegia transferencia y no tenia
 * adonde transferir.
 */
export function datosDeTransferencia(restaurant) {
  if (restaurant?.transfer_payment_enabled !== true) return null

  const alias = texto(restaurant.transfer_payment_alias)
  const cvu = texto(restaurant.transfer_payment_cvu)
  if (!alias && !cvu) return null

  return {
    alias: alias || null,
    cvu: cvu || null,
    titular: texto(restaurant.transfer_payment_holder) || null,
    banco: texto(restaurant.transfer_payment_bank) || null,
    instrucciones: texto(restaurant.transfer_payment_instructions) || null,
  }
}

export function aceptaTransferencia(restaurant) {
  return datosDeTransferencia(restaurant) !== null
}

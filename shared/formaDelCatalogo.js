// Locales que venden eligiendo ADENTRO de un formato: heladerias.
//
// Espejo de lib/server/rubroDelAgente.ts del dashboard, que es donde vive el
// original. La misma regla la usan el agente de WhatsApp y la carga a mano en
// el panel; si aca fuera distinta, el mismo local se comportaria de tres
// maneras segun por donde entre el pedido.
//
// La forma sale de los DATOS, no de una lista de rubros: cualquier local que
// venda asi queda cubierto sin configurar nada.
//
// Sin esto, en el menu digital de una heladeria los 12 sabores salian "$0" y
// se podia mandar un pedido de "Banana split" solo: el carrito quedaba en
// "1 producto / Sin productos" y a la heladeria le entraba una comanda de cero
// pesos sin formato.

/**
 * Reparte las categorias en las que se piden y las que solo se eligen.
 *
 * @param {Array<{label?: string, items?: Array<{unitPrice?: number}>}>} categorias
 * @returns {{ deEleccion: string[], quePiden: string[], porFormato: boolean }}
 */
export function formaDelCatalogo(categorias) {
  const deEleccion = []
  const quePiden = []

  for (const categoria of Array.isArray(categorias) ? categorias : []) {
    const items = Array.isArray(categoria?.items) ? categoria.items : []
    if (!items.length) continue

    const conPrecio = items.filter((item) => Number(item?.unitPrice ?? 0) > 0).length

    // Una categoria de eleccion es TODA gratis y con varias opciones: dos
    // productos en $0 pueden ser un error de carga, diez son un menu de
    // sabores.
    if (conPrecio === 0 && items.length >= 3) deEleccion.push(categoria.label)
    else if (conPrecio > 0) quePiden.push(categoria.label)
  }

  // Sin nada con precio no hay a que pegarle las elecciones: el local cargo
  // todo en $0 y eso es otro problema, no esta forma de vender.
  const porFormato = deEleccion.length > 0 && quePiden.length > 0
  return porFormato ? { deEleccion, quePiden, porFormato } : { deEleccion: [], quePiden: [], porFormato: false }
}

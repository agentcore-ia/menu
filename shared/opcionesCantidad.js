export function gruposConCantidades(grupos, selecciones) {
  return grupos.map((grupo) => {
    if (grupo.kind !== 'cantidades') return grupo
    const regla = grupo.cantidadPorSeleccion
    const cantidad = Number(regla?.opciones?.[selecciones[regla?.grupo]])
    const limite = Number.isInteger(cantidad) && cantidad > 0 ? cantidad : 0
    return { ...grupo, minSelect: limite, maxSelect: limite, cantidadObjetivo: limite }
  })
}

export function cambiarCantidad(seleccion, valor, cambio, limite) {
  const valores = Array.isArray(seleccion) ? seleccion : []
  if (cambio > 0) return valores.length < limite ? [...valores, valor] : valores
  const indice = valores.lastIndexOf(valor)
  return indice < 0 ? valores : valores.filter((_, i) => i !== indice)
}

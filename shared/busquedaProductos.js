// Buscar productos en TODOS los locales de la vitrina de Capta Delivery: el
// cliente escribe "pizza" y ve las pizzas de cada pizzeria.
//
// Sin acentos, sin mayusculas y sin importar el plural ("pizzas" encuentra
// "Pizza muzzarella"). Pesa mas que este en el nombre que en la descripcion.
//
//   node --test shared/busquedaProductos.test.mjs

export function normalizarTexto(valor) {
  return String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Las palabras que se buscan: "pizzas" queda "pizza", "empanadas de carne" -> empanada, carne. */
export function palabrasDeLaBusqueda(q) {
  const vacias = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'y', 'a', 'en', 'un', 'una'])
  return normalizarTexto(q)
    .split(' ')
    .filter((p) => p.length >= 2 && !vacias.has(p))
    .map((p) => (p.length > 3 && p.endsWith('es') && !p.endsWith('ses') ? p.slice(0, -2) : p.length > 3 && p.endsWith('s') ? p.slice(0, -1) : p))
}

/**
 * Cuanto coincide un producto con la busqueda (0 = nada). Todas las palabras
 * tienen que estar en algun lado del producto.
 */
export function puntajeDelProducto(producto, palabras) {
  if (!palabras.length) return 0
  const nombre = normalizarTexto(producto?.name)
  const categoria = normalizarTexto(producto?.category)
  const alias = normalizarTexto(Array.isArray(producto?.aliases) ? producto.aliases.join(' ') : producto?.aliases)
  const descripcion = normalizarTexto(producto?.description)

  let puntaje = 0
  for (const p of palabras) {
    if (nombre.split(' ').some((w) => w.startsWith(p))) puntaje += 10
    else if (nombre.includes(p)) puntaje += 7
    else if (categoria.includes(p) || alias.includes(p)) puntaje += 5
    else if (descripcion.includes(p)) puntaje += 2
    else return 0
  }
  // Que el nombre empiece con lo buscado es lo mas probable que quiera.
  if (nombre.startsWith(palabras[0])) puntaje += 3
  return puntaje
}

/**
 * Los productos que coinciden, ordenados: primero los que mejor coinciden y de
 * locales abiertos; con un tope por local para que se vean varias opciones.
 */
export function buscarProductos(productos, q, { porLocal = 4, total = 40, abierto = () => true } = {}) {
  const palabras = palabrasDeLaBusqueda(q)
  if (!palabras.length) return []
  const conPuntaje = productos
    .map((p) => ({ p, puntaje: puntajeDelProducto(p, palabras) }))
    .filter((x) => x.puntaje > 0)
    .sort(
      (a, b) =>
        b.puntaje - a.puntaje ||
        Number(abierto(b.p)) - Number(abierto(a.p)) ||
        Number(a.p.price) - Number(b.p.price),
    )
  const cuantos = new Map()
  const resultado = []
  for (const { p } of conPuntaje) {
    const n = cuantos.get(p.restaurant_id) || 0
    if (n >= porLocal) continue
    cuantos.set(p.restaurant_id, n + 1)
    resultado.push(p)
    if (resultado.length >= total) break
  }
  return resultado
}

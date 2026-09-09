// Reglas de la heladeria que ANTES estaban escritas en el codigo del menu:
// cuantos gustos entran en cada pote, como se agrupan los sabores y cual es el
// tamano que el local quiere empujar.
//
// Estaban atadas al NOMBRE del producto ("1/2" -> 3 sabores), asi que un local
// que llamo a su kilo "1K" recibia el tope de tres y no habia forma de
// arreglarlo desde el sistema. Ahora el local lo configura y el nombre solo
// decide el valor por defecto, para que una heladeria recien cargada ya
// funcione sin que nadie toque nada.
//
// El contrato con el dashboard es theme_overrides.heladeria:
//   {
//     topes: [{ id: <id del producto>, maximo: 5 }],
//     grupos: [{ nombre: "Chocolates", sabores: [<id del producto>, ...] }],
//     destacado: { id: <id del producto>, texto: "Mas elegido" }
//   }

const SELLO_POR_DEFECTO = 'Más elegido'
const GRUPO_RESTO = 'Otros'

function texto(valor) {
  return String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Tope por defecto leido del nombre del envase. Es el que se usa mientras el
 * local no configure el suyo.
 *
 * Reconoce las tres formas en que se escribe cada peso ("1 Kilo", "1K", "1kg";
 * "1/2", "medio", "500g"), porque cada heladeria carga sus envases como
 * quiere y antes cualquier variante caia en el tope generico de tres.
 */
export function topePorNombre(nombre) {
  const t = texto(nombre)
  if (!t) return 3

  // El cucurucho y el vasito son de una o dos bochas, no un pote.
  if (/cucurucho|cono|vaso|vasito|copa|bocha|palito/.test(t)) return 2

  if (/(^|[^\d/])(1|un|uno)\s*(kilo|kg|k)\b/.test(t) || /^1\s*k$/.test(t)) return 5
  if (/3\s*\/\s*4|750\s*g|tres\s*cuartos/.test(t)) return 4
  if (/1\s*\/\s*2|500\s*g|medio/.test(t)) return 3
  if (/1\s*\/\s*4|250\s*g|cuarto/.test(t)) return 2
  return 3
}

/**
 * Normaliza lo que dejo guardado el dashboard. Todo lo que venga roto se
 * ignora: un menu abierto no es lugar para explotar por un dato mal cargado.
 *
 * El nombre suelto en theme.tamanoDestacado es como se guardaba el sello antes
 * de que esto fuera configurable; se sigue leyendo para no romper a los
 * locales que ya lo tienen.
 */
export function configuracionDeHeladeria(theme) {
  const crudo = theme && typeof theme === 'object' ? theme.heladeria : null
  const config = crudo && typeof crudo === 'object' && !Array.isArray(crudo) ? crudo : {}

  const topes = new Map()
  for (const entrada of Array.isArray(config.topes) ? config.topes : []) {
    const id = String(entrada?.id ?? '').trim()
    const maximo = Math.round(Number(entrada?.maximo))
    if (!id || !Number.isFinite(maximo) || maximo < 1) continue
    topes.set(id, Math.min(maximo, 20))
  }

  const grupos = []
  for (const entrada of Array.isArray(config.grupos) ? config.grupos : []) {
    const nombre = String(entrada?.nombre ?? '').trim().slice(0, 40)
    const sabores = (Array.isArray(entrada?.sabores) ? entrada.sabores : [])
      .map((id) => String(id ?? '').trim())
      .filter(Boolean)
    if (!nombre || grupos.some((otro) => texto(otro.nombre) === texto(nombre))) continue
    grupos.push({ nombre, sabores })
  }

  const destacadoId = String(config.destacado?.id ?? '').trim()
  const destacadoTexto = String(config.destacado?.texto ?? '').trim().slice(0, 24)
  const destacadoNombre = String(theme?.tamanoDestacado ?? '').trim()

  // Los carteles de promo van abajo de los tamaños. Son imagenes con el texto
  // adentro: el local las arma como quiere y aca no se les escribe nada encima.
  const promos = []
  for (const entrada of Array.isArray(config.promos) ? config.promos : []) {
    const imagen = String(entrada?.imagen ?? '').trim()
    if (!/^https?:\/\/|^\//.test(imagen)) continue
    // Las medidas se guardan al subir el cartel. Sirven para que el navegador
    // le reserve el lugar ANTES de bajarlo: sin eso los tres carteles quedan
    // apilados en cero pixeles, el navegador no los considera visibles y nunca
    // los baja (paso: en el menu no aparecia ninguno).
    const ancho = Math.round(Number(entrada?.ancho))
    const alto = Math.round(Number(entrada?.alto))
    promos.push({
      imagen,
      // El alt no es decoracion: el cartel dice el precio y la condicion, y
      // quien usa lector de pantalla no ve nada de eso.
      alt: String(entrada?.alt ?? '').trim().slice(0, 160),
      ancho: Number.isFinite(ancho) && ancho > 0 ? ancho : undefined,
      alto: Number.isFinite(alto) && alto > 0 ? alto : undefined,
    })
  }

  return {
    topes,
    grupos,
    promos,
    destacado: {
      id: destacadoId,
      nombre: destacadoNombre,
      texto: destacadoTexto || SELLO_POR_DEFECTO,
    },
  }
}

/** Cuantos gustos entran en este envase. */
export function topeDeSabores(tamano, config) {
  const id = String(tamano?.id ?? '').trim()
  const configurado = id ? config?.topes?.get?.(id) : undefined
  if (Number.isFinite(configurado) && configurado >= 1) return configurado
  return topePorNombre(tamano?.name)
}

/** El sello del envase que el local quiere empujar, o null si no lleva. */
export function selloDeTamano(tamano, config) {
  const destacado = config?.destacado
  if (!destacado) return null

  const id = String(tamano?.id ?? '').trim()
  if (destacado.id) return destacado.id === id ? destacado.texto : null

  // Sin id guardado, se compara por nombre: asi se leia antes.
  if (!destacado.nombre) return null
  return texto(destacado.nombre) === texto(tamano?.name) ? destacado.texto : null
}

function grupoPorNombre(nombre) {
  const t = texto(nombre)
  if (/(frutilla|limon|frutos|fruta|naranja|maracuya|ananas|banana split)/.test(t)) return 'Frutales'
  if (/chocolate|choco/.test(t)) return 'Chocolate'
  if (/(dulce de leche|tramontana|cookies|menta|granizad|oreo)/.test(t)) return 'Especiales'
  return 'Clasicos'
}

/**
 * Reparte los sabores en los grupos que armo el local y devuelve los chips que
 * hay que dibujar.
 *
 * Dos cosas que antes salian mal:
 * - Los chips eran una lista fija, asi que una heladeria sin ningun frutal
 *   igual mostraba "Frutales" y el cliente llegaba a una pantalla vacia. Ahora
 *   solo se dibuja el grupo que tiene sabores.
 * - Un sabor que el local no metio en ningun grupo desaparecia de todos los
 *   filtros. Van a "Otros", que se agrega solo cuando hace falta.
 *
 * Con un solo grupo no se dibuja nada: "Todos" y el unico grupo muestran lo
 * mismo y la fila de chips ocuparia lugar sin filtrar nada.
 */
export function saboresAgrupados(sabores, config) {
  const lista = Array.isArray(sabores) ? sabores : []
  const grupos = config?.grupos ?? []

  const porSabor = new Map()
  if (grupos.length) {
    for (const grupo of grupos) {
      for (const id of grupo.sabores) {
        if (!porSabor.has(id)) porSabor.set(id, grupo.nombre)
      }
    }
  }

  const conGrupo = lista.map((sabor) => ({
    ...sabor,
    flavorCategory: grupos.length
      ? porSabor.get(String(sabor?.id ?? '')) || GRUPO_RESTO
      : grupoPorNombre(sabor?.name),
  }))

  const usados = new Set(conGrupo.map((sabor) => sabor.flavorCategory))
  const orden = grupos.length
    ? [...grupos.map((grupo) => grupo.nombre), GRUPO_RESTO]
    : ['Frutales', 'Clasicos', 'Chocolate', 'Especiales']
  const conSabores = orden.filter((nombre) => usados.has(nombre))

  return {
    sabores: conGrupo,
    chips: conSabores.length > 1 ? ['Todos', ...conSabores] : [],
  }
}

// La animacion de "agregado al pedido".
//
// Al agregar un producto sale una bolita de color del boton que se toco, viaja
// en arco hasta el carrito (el icono de arriba o la barra de abajo, el que este
// a la vista) y ahi el carrito rebota. El boton tocado hace un pulso con una
// onda. Es lo mismo en todos los menus: no depende de la plantilla.
//
// No toca el estado del menu: solo mira donde se hizo el ultimo toque y dibuja
// elementos sueltos que se borran solos. Si algo falta (no hay carrito a la
// vista, el navegador no anima), no hace nada y el aviso de siempre sigue.

const OBJETIVOS = [
  '.cart-button',
  '.cu-boton-redondo[aria-label="Ver pedido"]',
  '.order-bar-button',
  '.order-bar',
]

let ultimoToque = null
let instalado = false

function reducirMovimiento() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Anota donde se toco por ultima vez (captura: corre antes que el menu). */
export function seguirToques() {
  if (instalado || typeof document === 'undefined') return () => {}
  instalado = true

  const alTocar = (evento) => {
    const boton = evento.target?.closest?.('button, a')
    ultimoToque = { x: evento.clientX, y: evento.clientY, el: boton || null, t: Date.now() }
  }
  document.addEventListener('click', alTocar, true)

  return () => {
    document.removeEventListener('click', alTocar, true)
    instalado = false
  }
}

function visible(rect) {
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
}

function objetivo() {
  for (const selector of OBJETIVOS) {
    for (const el of document.querySelectorAll(selector)) {
      if (visible(el.getBoundingClientRect())) return el
    }
  }
  return null
}

function colorDe(elemento) {
  try {
    if (elemento) {
      const fondo = getComputedStyle(elemento).backgroundColor
      if (fondo && fondo !== 'rgba(0, 0, 0, 0)' && fondo !== 'transparent') return fondo
    }
    const raiz = document.querySelector('.phone-surface') || document.body
    const primario = getComputedStyle(raiz).getPropertyValue('--theme-primary').trim()
    return primario || '#f4511e'
  } catch {
    return '#f4511e'
  }
}

function suelto(estilo) {
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  Object.assign(el.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '2147483000',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
    ...estilo,
  })
  document.body.appendChild(el)
  // Por si la animacion no llega a terminar (pestaña en segundo plano): no
  // queda nada suelto en la pagina.
  window.setTimeout(() => el.remove(), 2500)
  return el
}

function onda(x, y, color, tam, ms = 560) {
  const el = suelto({
    width: `${tam}px`,
    height: `${tam}px`,
    marginLeft: `${-tam / 2}px`,
    marginTop: `${-tam / 2}px`,
    borderRadius: '50%',
    border: `2px solid ${color}`,
    transform: `translate(${x}px, ${y}px) scale(0.3)`,
    opacity: '0.75',
  })
  const a = el.animate(
    [
      { transform: `translate(${x}px, ${y}px) scale(0.3)`, opacity: 0.75 },
      { transform: `translate(${x}px, ${y}px) scale(1.6)`, opacity: 0 },
    ],
    { duration: ms, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' },
  )
  a.onfinish = () => el.remove()
  a.oncancel = () => el.remove()
}

function rebote(elemento) {
  if (!elemento?.animate) return
  elemento.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.3)', offset: 0.28 },
      { transform: 'scale(0.9)', offset: 0.5 },
      { transform: 'scale(1.08)', offset: 0.72 },
      { transform: 'scale(1)' },
    ],
    { duration: 560, easing: 'cubic-bezier(.3,.7,.4,1)' },
  )
  for (const badge of elemento.querySelectorAll('.cart-badge, .order-badge, .cu-badge')) {
    badge.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.7)', offset: 0.35 },
        { transform: 'scale(1)' },
      ],
      { duration: 460, easing: 'cubic-bezier(.3,.9,.4,1.4)' },
    )
  }
}

/** Dispara la animacion para el ultimo producto agregado. */
export function volarAlCarrito() {
  if (typeof document === 'undefined' || !document.body.animate) return

  const meta = objetivo()
  const toque = ultimoToque && Date.now() - ultimoToque.t < 1500 ? ultimoToque : null

  try {
    navigator.vibrate?.(10)
  } catch {
    // sin vibracion
  }

  if (reducirMovimiento()) {
    if (meta) rebote(meta)
    return
  }

  // Sin un toque cerca en el tiempo (agregado desde otro lado) solo rebota.
  if (!toque || !meta) {
    if (meta) rebote(meta)
    return
  }

  const color = colorDe(toque.el)
  const destino = meta.getBoundingClientRect()
  const x0 = toque.x
  const y0 = toque.y
  const x1 = destino.left + destino.width / 2
  const y1 = destino.top + destino.height / 2

  // El boton tocado: pulso y una onda.
  if (toque.el?.animate) {
    toque.el.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.8)', offset: 0.3 },
        { transform: 'scale(1.12)', offset: 0.65 },
        { transform: 'scale(1)' },
      ],
      { duration: 380, easing: 'cubic-bezier(.3,.7,.4,1)' },
    )
  }
  onda(x0, y0, color, 54, 520)

  // La bolita: arco cuadratico desde el toque hasta el carrito.
  const tam = 22
  const bola = suelto({
    width: `${tam}px`,
    height: `${tam}px`,
    marginLeft: `${-tam / 2}px`,
    marginTop: `${-tam / 2}px`,
    borderRadius: '50%',
    background: color,
    border: '2.5px solid #fff',
    boxShadow: `0 6px 16px rgba(0,0,0,.28), 0 0 0 4px ${color}33`,
    transform: `translate(${x0}px, ${y0}px) scale(0.6)`,
  })

  const distancia = Math.hypot(x1 - x0, y1 - y0)
  const alto = Math.min(170, Math.max(70, distancia * 0.45))
  const cx = (x0 + x1) / 2
  const cy = Math.min(y0, y1) - alto
  const pasos = 20
  const cuadros = []
  for (let i = 0; i <= pasos; i += 1) {
    const t = i / pasos
    const u = 1 - t
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1
    const escala = t < 0.18 ? 0.6 + (t / 0.18) * 0.6 : 1.2 - ((t - 0.18) / 0.82) * 0.75
    cuadros.push({
      transform: `translate(${x}px, ${y}px) scale(${escala.toFixed(3)})`,
      opacity: t > 0.9 ? 1 - (t - 0.9) * 6 : 1,
      offset: t,
    })
  }

  const duracion = 640
  const vuelo = bola.animate(cuadros, { duration: duracion, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' })
  const limpiar = () => bola.remove()
  vuelo.onfinish = () => {
    limpiar()
    // Si el carrito dejo de estar a la vista mientras volaba, no se rebota nada.
    const actual = document.contains(meta) ? meta : objetivo()
    if (actual) {
      rebote(actual)
      const r = actual.getBoundingClientRect()
      if (visible(r)) onda(r.left + r.width / 2, r.top + r.height / 2, color, 46, 480)
    }
  }
  vuelo.oncancel = limpiar
}

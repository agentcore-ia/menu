// La barra de abajo de Capta Delivery, dentro del menu de un local.
//
// Cuando el cliente entra al menu DESDE la vitrina (?vitrina=1) sigue viendo la
// barra de la app (Inicio, Pedidos, Guardados, Perfil), asi no queda "adentro"
// de un local sin forma de volver o de ir a su cuenta. Cada boton lleva a esa
// pantalla de la vitrina (/pedi?vista=...).
//
// Los iconos y los colores son los de la vitrina (src/CaptaDeliveryApp.jsx).
// Las clases empiezan con cb-: la hoja de la vitrina no se carga en los menus.
import './barra-capta.css'

const CLAVE_FAVORITOS = 'capta-vitrina-favoritos'

const TRAZO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }

function Icono({ nombre }) {
  if (nombre === 'inicio') {
    return (
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path d="M3.6 10.4 12 3.5l8.4 6.9V20a1 1 0 0 1-1 1h-4.6v-6.2H9.2V21H4.6a1 1 0 0 1-1-1z" {...TRAZO} />
      </svg>
    )
  }
  if (nombre === 'pedidos') {
    return (
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <rect x="5.5" y="3" width="13" height="18" rx="3" {...TRAZO} />
        <path d="M9 3.2v1.3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3.2" {...TRAZO} />
      </svg>
    )
  }
  if (nombre === 'guardados') {
    return (
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.6L5.5 21V4.5a1 1 0 0 1 1-1z" {...TRAZO} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <circle cx="12" cy="8" r="4.2" {...TRAZO} />
      <path d="M4 20.5c.9-4 4.1-6.2 8-6.2s7.1 2.2 8 6.2" {...TRAZO} />
    </svg>
  )
}

function cuantosGuardados() {
  try {
    const lista = JSON.parse(window.localStorage?.getItem(CLAVE_FAVORITOS) || '[]')
    return Array.isArray(lista) ? lista.length : 0
  } catch {
    return 0
  }
}

const ITEMS = [
  { id: 'inicio', texto: 'Inicio', href: '/pedi' },
  { id: 'pedidos', texto: 'Pedidos', href: '/pedi?vista=pedidos' },
  { id: 'puntos', texto: 'Mis puntos', href: '/pedi?hoja=puntos' },
  { id: 'guardados', texto: 'Guardados', href: '/pedi?vista=guardados' },
  { id: 'perfil', texto: 'Perfil', href: '/pedi?vista=perfil' },
]

export default function BarraCapta() {
  const guardados = cuantosGuardados()

  return (
    <nav className="cb-barra" aria-label="Capta Delivery">
      {ITEMS.map((item) => (
        <a key={item.id} href={item.href} className={item.id === 'puntos' ? 'cb-puntos' : undefined}>
          {item.id === 'puntos' ? (
            <svg className="cb-bulto" viewBox="0 0 156 31" aria-hidden="true"><path d="M0,30 C18,30 26,27 36,19 C47,10 60,2 78,2 C96,2 109,10 120,19 C130,27 138,30 156,30 L156,31 L0,31 Z" fill="#fff" /></svg>
          ) : null}
          <span className="cb-icono">
            {item.id === 'puntos' ? (
              <span className="cb-puntos-boton">
                {/* El regalo (contorno blanco): el mismo dibujo que el boton de referencia. */}
                <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.4" y="8.3" width="17.2" height="3.4" rx="1.4" />
                  <path d="M5.2 11.7v7.2a2.1 2.1 0 0 0 2.1 2.1h9.4a2.1 2.1 0 0 0 2.1-2.1v-7.2" />
                  <path d="M12 8.3V21" />
                  <path d="M12 8.3C9.6 8.3 7.2 7.5 7.2 5.8 7.2 4.5 8.4 3.8 9.6 4.1 11.1 4.5 12 6.3 12 8.3Z" />
                  <path d="M12 8.3c2.4 0 4.8-.8 4.8-2.5 0-1.3-1.2-2-2.4-1.7C12.9 4.5 12 6.3 12 8.3Z" />
                </svg>
              </span>
            ) : (
              <Icono nombre={item.id} />
            )}
            {item.id === 'guardados' && guardados ? <span className="cb-globo">{guardados}</span> : null}
          </span>
          <span>{item.texto}</span>
        </a>
      ))}
    </nav>
  )
}

// El ultimo mandado pedido desde este navegador, para volver a seguirlo desde
// la vitrina (como el "pedido en curso" de Rappi). Vence solo: despues de 12 h
// ya se entrego o se cancelo, y el seguimiento sigue llegando por WhatsApp.
const CLAVE_EN_CURSO = 'capta-mandado-en-curso'
const HORAS_EN_CURSO = 12

export function guardarEnCurso(dato) {
  try {
    window.localStorage.setItem(CLAVE_EN_CURSO, JSON.stringify({ ...dato, at: Date.now() }))
  } catch {
    // sin almacenamiento (modo privado): queda el WhatsApp
  }
}

export function leerEnCurso(ciudad) {
  try {
    const dato = JSON.parse(window.localStorage.getItem(CLAVE_EN_CURSO) || 'null')
    if (!dato?.seguimiento || Date.now() - Number(dato.at) > HORAS_EN_CURSO * 3600 * 1000) return null
    if (ciudad && dato.ciudad && String(dato.ciudad).toLowerCase() !== String(ciudad).toLowerCase()) return null
    return dato
  } catch {
    return null
  }
}

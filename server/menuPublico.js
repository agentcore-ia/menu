// LO QUE SALE DEL SERVIDOR HACIA EL NAVEGADOR cuando se pide el menu de un local.
//
// El menu lleva los horarios del local (businessHours) y adentro venian TODOS
// sus ajustes internos (horarios._settings): los datos de facturacion, los
// telefonos del dueño para los avisos, lo que aprendio el agente, los mails de
// los cierres... Cualquiera que abriera el menu los podia leer. Ademas ahi se
// guarda la contraseña del Wi-Fi (mesaWifi), que solo se entrega desde una mesa
// (server/llamadosDeMesa.js).
//
// La pantalla usa unos pocos: esos pasan y el resto se queda en el servidor.
// Las rutas del servidor siguen usando el menu completo (zonas de envio, etc.).

/** Los ajustes que la pantalla del menu lee de businessHours._settings. */
export const AJUSTES_PUBLICOS = [
  // Recargo por forma de pago (src/MenuApp.jsx).
  'paymentSurcharge',
  // Pedidos programados (shared/pedidoProgramado.js).
  'aceptaProgramados',
  'deliveryCapta',
  // Rubro y menu del dia (shared/rubros.js, shared/horarioMenuDelDia.js).
  'rubro',
  'menuDelDiaHorario',
  'menuDelDiaNombre',
]

export function menuParaElCliente(menu) {
  const horarios = menu?.businessHours
  if (!horarios || typeof horarios !== 'object' || Array.isArray(horarios) || !horarios._settings) return menu
  const ajustes = {}
  for (const clave of AJUSTES_PUBLICOS) {
    if (horarios._settings[clave] !== undefined) ajustes[clave] = horarios._settings[clave]
  }
  return { ...menu, businessHours: { ...horarios, _settings: ajustes } }
}

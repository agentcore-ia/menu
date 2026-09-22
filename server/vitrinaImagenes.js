// Las fotos de las tarjetas de la vitrina de Capta Delivery.
//
// La tarjeta de un local necesita dos imagenes: la PORTADA (la foto grande) y
// el LOGO (el circulo). Casi ningun local tiene eso cargado como tal: lo que
// hay son las imagenes que ya se armaron para compartir el menu por WhatsApp
// (public/<slug>/compartir.jpg e icono.png, ver compartir-menus-og) y la
// cabecera del menu.
//
// Por eso se busca en este orden:
//   1. lo que el local cargo a proposito para la vitrina (_settings.captaFoto
//      y _settings.captaLogo, por si algun dia se sube desde el panel),
//   2. las imagenes curadas del repo, que son las lindas y estan optimizadas,
//   3. la cabecera del menu (hero_image_url / headerImages),
//   4. nada: la pantalla dibuja un fondo de color con la inicial del local.
//
// Lo del punto 2 es una lista escrita a mano a proposito: son archivos de este
// repo, no datos. Un local nuevo sin archivos cae solo en los otros puntos y la
// vitrina sigue funcionando.
const IMAGENES_DEL_REPO = {
  troka: { portada: '/troka/compartir.png', logo: '/troka/logo.webp' },
  babson: { portada: '/babson/compartir.png', logo: '/babson/logo.webp' },
  bruderpizza: { portada: '/bruderpizza/compartir.jpg', logo: '/bruderpizza/icono.png' },
  'boutique-cian': { portada: '/boutique-cian/compartir.jpg', logo: '/boutique-cian/icono.png' },
  panacea: { portada: '/panacea/portada.jpg', logo: '/panacea/icono.png' },
  racing: { portada: '/racing/portada.jpg', logo: '/racing/logo.png' },
  'craft-burguer': { portada: '/craft-burguer/compartir.jpg', logo: '/craft-burguer/icono.png' },
  'lo-de-totto': { portada: '/lo-de-totto/compartir.png', logo: '/lo-de-totto/logo.svg' },
  'sabor-a-pampa': { logo: '/sabor-a-pampa/logo.png' },
  almendra: { portada: '/almendra/header.png', logo: '/almendra/logo.png' },
  kika: { portada: '/kika/banner.png' },
}

function primera(...valores) {
  for (const valor of valores) {
    const texto = String(valor ?? '').trim()
    if (texto) return texto
  }
  return null
}

/**
 * La portada y el logo de un local para la vitrina.
 *
 * @param {string} slug
 * @param {{ ajustes?: object, presentacion?: object }} datos
 */
export function imagenesDeVitrina(slug, { ajustes = {}, presentacion = {} } = {}) {
  const delRepo = IMAGENES_DEL_REPO[String(slug ?? '').toLowerCase()] ?? {}
  const overrides = presentacion?.theme_overrides ?? {}
  const cabeceras = Array.isArray(overrides.headerImages) ? overrides.headerImages.filter(Boolean) : []

  return {
    portada: primera(
      ajustes.captaFoto,
      delRepo.portada,
      presentacion?.hero_image_url,
      cabeceras[0],
      overrides.heroBackground,
    ),
    logo: primera(ajustes.captaLogo, delRepo.logo, overrides.logo, overrides.logoImage, overrides.logoBanda),
    // El color de marca del menu, para que la tarjeta del local no sea toda
    // gris cuando no hay foto.
    color: primera(overrides.accent, overrides.primary, '#f97316'),
  }
}

export { IMAGENES_DEL_REPO }

const MENU_NET_DOMAIN = '.menu.net.ar'

function normalizeColor(value, fallback) {
  const color = String(value ?? '').trim()
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback
}

function normalizeName(value, fallback) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ')
  return name || fallback
}

function truncateShortName(value) {
  const name = normalizeName(value, 'Menu')
  return name.length > 12 ? name.slice(0, 12).trim() : name
}

function getManifestStartUrl(req, accountId) {
  const host = String(req?.headers?.host ?? '').split(':')[0].toLowerCase()

  if (host.endsWith(MENU_NET_DOMAIN)) {
    const subdomain = host.slice(0, -MENU_NET_DOMAIN.length).split('.').filter(Boolean).at(-1)

    if (subdomain && subdomain !== 'www') {
      return '/'
    }
  }

  return `/${encodeURIComponent(accountId)}`
}

export function createMenuManifest(menu, req) {
  const accountId = menu?.accountId || req?.params?.accountId || req?.query?.accountId || 'menu'
  const presentation = menu?.presentation ?? {}
  const theme = presentation.theme ?? {}
  const accountName = normalizeName(
    menu?.accountName || presentation.branding?.wordmark || accountId,
    'Menu digital',
  )
  const appName = `${accountName} | Menu digital`
  const startUrl = getManifestStartUrl(req, accountId)
  const themeColor = normalizeColor(theme.primary, '#ff6a00')
  const backgroundColor = normalizeColor(
    theme.background || theme.pageBackground || theme.surface,
    '#ffffff',
  )

  return {
    id: `/capta-menu-${accountId}`,
    name: appName,
    short_name: truncateShortName(accountName),
    description: `Menu digital, pedidos y puntos de ${accountName}.`,
    start_url: startUrl,
    scope: startUrl,
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: backgroundColor,
    theme_color: themeColor,
    categories: ['food', 'shopping', 'business'],
    lang: 'es-AR',
    icons: [
      {
        src: '/assets/capta-pwa-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/assets/capta-pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/assets/capta-pwa-icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}

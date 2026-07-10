import fs from 'node:fs'
import path from 'node:path'

const MENU_NET_DOMAIN = '.menu.net.ar'

const ACCOUNT_METADATA = {
  almendra: {
    title: 'Almendra | Menu digital',
    siteName: 'Almendra',
    description: 'Cafe de especialidad, productos y pedidos de Almendra.',
    image: '/almendra/logo.png',
    favicon: '/almendra/logo.png',
  },
  kika: {
    title: 'Kika | Menu digital',
    siteName: 'Kika',
    description: 'Cafe, pasteleria y buenos momentos en Kika.',
    image: '/kika/favicon.svg',
    favicon: '/kika/favicon.svg',
  },
  saborapampa: {
    title: 'Sabor a Pampa | Menu digital',
    siteName: 'Sabor a Pampa',
    description: 'Menu digital de Sabor a Pampa. Casero, gourmet y hecho con amor.',
    image: '/sabor-a-pampa/logo.png',
    favicon: '/sabor-a-pampa/logo.png',
  },
}

function getRequestHost(req) {
  return String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
}

function getAccountKey(req) {
  const queryAccount = Array.isArray(req.query?.account) ? req.query.account[0] : req.query?.account

  if (queryAccount) {
    return normalizeAccountKey(queryAccount)
  }

  const host = getRequestHost(req)

  if (host.endsWith(MENU_NET_DOMAIN)) {
    return normalizeAccountKey(host.slice(0, -MENU_NET_DOMAIN.length).split('.').filter(Boolean).at(-1))
  }

  return 'host'
}

function normalizeAccountKey(account) {
  const key = String(account || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  if (key === 'saborapampa') {
    return 'saborapampa'
  }

  return key
}

function getPublicOrigin(req) {
  const protocol = String(req.headers['x-forwarded-proto'] || 'https')
    .split(',')[0]
    .trim()
  const host = getRequestHost(req)
  return host ? `${protocol}://${host}` : ''
}

function toAbsoluteUrl(req, value) {
  if (!value || /^https?:\/\//i.test(value)) {
    return value
  }

  return `${getPublicOrigin(req)}${value.startsWith('/') ? value : `/${value}`}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function replaceMetaContent(html, attributeName, attributeValue, value) {
  const escapedValue = escapeHtml(value)
  const pattern = new RegExp(
    `(<meta\\s+[^>]*${attributeName}=["']${attributeValue}["'][^>]*content=["'])[^"']*(["'][^>]*>)`,
    'i',
  )

  if (pattern.test(html)) {
    return html.replace(pattern, `$1${escapedValue}$2`)
  }

  return html.replace('</head>', `    <meta ${attributeName}="${attributeValue}" content="${escapedValue}" />\n  </head>`)
}

function injectMetadata(html, metadata, req) {
  const title = metadata.title
  const description = metadata.description
  const image = toAbsoluteUrl(req, metadata.image)
  const favicon = metadata.favicon
  const currentUrl = toAbsoluteUrl(req, req.url || '/')

  let output = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  output = output.replace(
    /<link\s+rel=["']icon["'][^>]*>/i,
    `<link rel="icon" type="${favicon.endsWith('.svg') ? 'image/svg+xml' : 'image/png'}" href="${escapeHtml(favicon)}" />`,
  )

  output = replaceMetaContent(output, 'name', 'description', description)
  output = replaceMetaContent(output, 'property', 'og:title', title)
  output = replaceMetaContent(output, 'property', 'og:description', description)
  output = replaceMetaContent(output, 'property', 'og:image', image)
  output = replaceMetaContent(output, 'property', 'og:site_name', metadata.siteName)
  output = replaceMetaContent(output, 'name', 'twitter:title', title)
  output = replaceMetaContent(output, 'name', 'twitter:description', description)
  output = replaceMetaContent(output, 'name', 'twitter:image', image)

  if (!/<meta\s+property=["']og:url["']/i.test(output)) {
    output = output.replace('</head>', `    <meta property="og:url" content="${escapeHtml(currentUrl)}" />\n  </head>`)
  } else {
    output = replaceMetaContent(output, 'property', 'og:url', currentUrl)
  }

  return output
}

function readIndexHtml() {
  const candidates = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8')
    }
  }

  throw new Error('No se encontro index.html para renderizar el menu.')
}

export default function handler(req, res) {
  const accountKey = getAccountKey(req)
  const metadata = ACCOUNT_METADATA[accountKey] || ACCOUNT_METADATA.host || {
    title: 'HOST | Menu digital',
    siteName: 'HOST',
    description: 'Menu digital, pedidos y puntos.',
    image: '/assets/host-favicon.png',
    favicon: '/favicon.png',
  }

  try {
    const html = injectMetadata(readIndexHtml(), metadata, req)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300')
    res.status(200).send(html)
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'No se pudo renderizar el menu.')
  }
}

import { useEffect, useMemo, useState } from 'react'
import './App.css'

const defaultPresentation = {
  template: 'editorial',
  layout: 'editorial',
  branding: { wordmark: '', subtitle: '' },
  theme: {
    id: 'ivory-olive',
    primary: '#445d39',
    accent: '#4f6546',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Manrope',
    logoImage: '',
    background: '#f4efe6',
    surface: '#fffdfa',
    surfaceAlt: '#f8f4ec',
    text: '#1b1b18',
    muted: 'rgba(27, 27, 24, 0.72)',
    primaryText: '#fffdf8',
    border: 'rgba(96, 91, 74, 0.12)',
    shadow: 'rgba(45, 38, 24, 0.08)',
    pageBackground: '',
    heroBackground: '',
    heroRadius: '',
    heroMinHeight: '',
    headerObjectFit: '',
    contentBackground: '',
    categoryBackground: '',
    categoryActiveBackground: '',
    categoryText: '',
    categoryActiveText: '',
    categoryBorder: '',
    categoryRadius: '',
    cardBackground: '',
    cardText: '',
    cardMuted: '',
    cardPrice: '',
    cardBorder: '',
    cardRadius: '',
    cardShadow: '',
    productImageHeight: '',
    addButtonBackground: '',
    addButtonText: '',
  },
  hero: {
    image: '/dishes/hero-clean-cut.png',
    video: '',
    title: '',
    accent: '',
    description: '',
  },
  cards: { style: 'editorial-list' },
  preview: {
    productMedia: 'image-with-video-chip',
    autoplayVideos: false,
    mutedVideos: true,
  },
}

const layoutConfigs = {
  editorial: {
    description: 'Diseno clasico y elegante: portada, categorias y productos en una lista limpia.',
    headerTextFields: {
      title: ['Titulo principal', 'Frase grande de la portada.'],
      accent: ['Texto destacado', 'Parte secundaria o resaltada del titulo.'],
      description: ['Descripcion principal', 'Texto corto que aparece en la portada del menu.'],
    },
  },
  bistro: {
    description: 'Diseno mas visual: una carta moderna con imagenes destacadas y ritmo tipo revista.',
    headerTextFields: {
      title: ['Titulo principal', 'Primera linea del hero.'],
      accent: ['Texto destacado', 'Segunda linea resaltada del hero.'],
      description: ['Descripcion principal', 'Texto corto debajo del titulo.'],
    },
  },
  luxe: {
    description: 'Diseno premium: mas dramatico y sofisticado, pensado para marcas gastronomicas elegantes.',
    headerTextFields: {
      title: ['Titulo principal', 'Primera linea del hero.'],
      accent: ['Texto destacado', 'Segunda linea resaltada del hero.'],
      description: ['Descripcion principal', 'Texto corto debajo del titulo.'],
    },
  },
  gelato: {
    description: 'Flujo de heladeria con formatos, tamanos, sabores y estetica dulce.',
    headerTextFields: {
      title: ['Saludo principal', 'Texto grande del inicio, por ejemplo: Hola!'],
      accent: ['Subtitulo', 'Pregunta o frase debajo del saludo.'],
    },
  },
  pizzeria: {
    description: 'Menu visual para pizzeria con header grafico, tabs y cards de dos columnas.',
    headerTextFields: null,
  },
  burger: {
    description: 'Menu oscuro para hamburgueseria con hero fuerte, categorias pill y cards bold.',
    headerTextFields: null,
  },
  'blue-burger': {
    description: 'Menu claro y azul para hamburgueseria con hero amplio, beneficios y cards horizontales.',
    headerTextFields: null,
  },
  host: {
    description: 'Menu dark para crispy chicken con hero impactante, tabs compactos y cards de combos en dos columnas.',
    headerTextFields: null,
  },
  kika: {
    description: 'Menu claro para cafeteria/pasteleria con portada fotografica, categorias circulares y secciones por rubro.',
    headerTextFields: null,
  },
  florian: {
    description: 'Menu editorial para cafe de especialidad con hero en video, categorias lineales y productos en columnas.',
    headerTextFields: null,
  },
}

const inheritedLayoutDefaults = {
  florian: {
    branding: { wordmark: 'FLORIAN', subtitle: 'CAFE DE ESPECIALIDAD' },
    theme: {
      id: 'inherits-florian',
      inheritPreset: 'florian',
      background: '#f5eee5',
      pageBackground: '#f5eee5',
      contentBackground: '#f7efe7',
      surface: '#fff8f1',
      surfaceAlt: '#efe2d5',
      text: '#172a34',
      muted: 'rgba(23, 42, 52, 0.72)',
      primary: '#c64b32',
      primaryText: '#fff8f1',
      accent: '#d36345',
      border: 'rgba(198, 75, 50, 0.2)',
      shadow: 'rgba(57, 43, 30, 0.13)',
      categoryActiveBackground: '#fff8f1',
      categoryActiveText: '#c64b32',
      categoryText: '#172a34',
      cardBackground: 'transparent',
      cardText: '#172a34',
      cardMuted: 'rgba(23, 42, 52, 0.68)',
      cardPrice: '#c64b32',
      addButtonBackground: '#c64b32',
      addButtonText: '#fff8f1',
    },
    hero: {
      title: 'BUEN CAFE,',
      accent: 'BUENOS MOMENTOS.',
      description: 'Cafe de especialidad y cocina simple, hecha con pasion en Chivilcoy.',
    },
    cards: { style: 'florian-list' },
    preview: {
      productMedia: 'video-first',
      autoplayVideos: true,
      mutedVideos: true,
    },
  },
  kika: {
    branding: { wordmark: 'KIKA', subtitle: 'CAFE' },
    theme: {
      id: 'inherits-kika',
      inheritPreset: 'kika',
      background: '#f5efe6',
      pageBackground: '#f5efe6',
      contentBackground: '#fffaf3',
      surface: '#fffaf3',
      surfaceAlt: '#f1e7da',
      text: '#263420',
      muted: 'rgba(38, 52, 32, 0.7)',
      primary: '#557348',
      primaryText: '#fffaf3',
      accent: '#5f7755',
      border: 'rgba(88, 105, 70, 0.18)',
      shadow: 'rgba(60, 46, 28, 0.13)',
      categoryActiveBackground: '#557348',
      categoryActiveText: '#fffaf3',
      cardBackground: '#fffdf8',
      cardText: '#263420',
      cardMuted: 'rgba(38, 52, 32, 0.66)',
      cardPrice: '#557348',
      addButtonBackground: '#557348',
      addButtonText: '#fffaf3',
    },
    hero: { image: '/kika/header.png' },
    cards: { style: 'kika-cards' },
    preview: {
      productMedia: 'video-first',
      autoplayVideos: true,
      mutedVideos: true,
    },
  },
}

const layoutDescriptions = Object.fromEntries(
  Object.entries(layoutConfigs).map(([layout, config]) => [layout, config.description]),
)

const cardStyleDescriptions = {
  'editorial-list': 'Productos en lista, facil de leer y rapido para pedir.',
  'magazine-list': 'Cards mas visuales, con mas protagonismo para fotos y platos destacados.',
  'glass-list': 'Cards con efecto premium/translucido para menus mas atmosfericos.',
  'gelato-cards': 'Cards grandes y suaves para formatos de heladeria.',
  'pizzeria-grid': 'Grilla de dos columnas con media arriba y precio destacado.',
  'burger-grid': 'Cards oscuras, verticales y con imagen grande del producto.',
  'blue-burger-list': 'Cards horizontales blancas con foto grande, precio azul y boton circular.',
  'host-grid': 'Cards oscuras con borde rojo, badge superior y boton rojo circular.',
  'kika-cards': 'Cards claras para cafeteria, con imagen suave, texto compacto y estilo Kika.',
  'florian-list': 'Lista editorial para cafe: media circular, texto a la derecha y precio terracota.',
}

const previewDescriptions = {
  'image-only': 'Solo muestra fotos, aunque el producto tenga video cargado.',
  'image-with-video-chip': 'La foto queda como vista principal y se muestra una etiqueta si el producto tiene video.',
  'video-first': 'El video se usa como vista principal cuando el producto tiene video.',
}

function getHeaderTextFields(layout) {
  return layoutConfigs[layout]?.headerTextFields ?? layoutConfigs.editorial.headerTextFields
}

function applyLayoutSelection(current, layout) {
  const next = structuredClone(current)
  const inheritedDefaults = inheritedLayoutDefaults[layout]

  next.layout = layout

  if (!inheritedDefaults) {
    if (next.theme?.inheritPreset) {
      delete next.theme.inheritPreset
    }

    if (typeof next.theme?.id === 'string' && next.theme.id.startsWith('inherits-')) {
      next.theme.id = layout === 'editorial' ? defaultPresentation.theme.id : layout
    }

    return next
  }

  next.branding = {
    ...next.branding,
    ...inheritedDefaults.branding,
  }
  next.theme = {
    ...next.theme,
    ...inheritedDefaults.theme,
  }
  next.hero = {
    ...next.hero,
    ...inheritedDefaults.hero,
  }
  next.cards = {
    ...next.cards,
    ...inheritedDefaults.cards,
  }
  next.preview = {
    ...next.preview,
    ...inheritedDefaults.preview,
  }

  return next
}

function getInitialAdminAccount() {
  const params = new URLSearchParams(window.location.search)
  return params.get('account') ?? ''
}

function readSavedToken() {
  return window.localStorage.getItem('neurorest-admin-token') ?? ''
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token,
  }
}

async function readApiPayload(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return { message: text || 'La respuesta del servidor no fue JSON.' }
}

async function uploadFileToSignedUrl(upload, file) {
  const formData = new FormData()
  formData.append('cacheControl', '3600')
  formData.append('', file)

  return fetch(upload.uploadUrl, {
    method: upload.method ?? 'PUT',
    headers: {
      'x-upsert': 'true',
    },
    body: formData,
  })
}

export default function AdminApp() {
  const [token, setToken] = useState(readSavedToken)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(getInitialAdminAccount)
  const [editor, setEditor] = useState(null)
  const [presentation, setPresentation] = useState(defaultPresentation)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [createForm, setCreateForm] = useState({
    name: "Sandra's Rose",
    slug: 'sandras-rose',
    city: '',
    address: '',
    demo: false,
    sourceAccountId: '',
    replaceProducts: false,
  })
  const [copyForm, setCopyForm] = useState({
    sourceAccountId: '',
    replaceExisting: false,
  })

  const products = useMemo(() => editor?.products ?? [], [editor])
  const restaurant = editor?.restaurant ?? null
  const menuPublicUrl = selectedAccount ? `${window.location.origin}/${selectedAccount}` : ''
  const headerTextFields = getHeaderTextFields(presentation.layout)
  const productStats = useMemo(
    () => ({
      total: products.length,
      withImage: products.filter((product) => product.image_url).length,
      withVideo: products.filter((product) => product.video_url).length,
    }),
    [products],
  )

  function applyEditorPayload(payload) {
    setEditor(payload)
    setPresentation({
      ...defaultPresentation,
      ...payload.presentation,
      branding: {
        ...defaultPresentation.branding,
        ...(payload.presentation?.branding ?? {}),
      },
      theme: {
        ...defaultPresentation.theme,
        ...(payload.presentation?.theme ?? {}),
      },
      hero: {
        ...defaultPresentation.hero,
        ...(payload.presentation?.hero ?? {}),
      },
      cards: {
        ...defaultPresentation.cards,
        ...(payload.presentation?.cards ?? {}),
      },
      preview: {
        ...defaultPresentation.preview,
        ...(payload.presentation?.preview ?? {}),
      },
    })
  }

  async function refreshEditor(accountSlug = selectedAccount) {
    if (!token || !accountSlug) {
      return null
    }

    const response = await fetch(`/api/admin/accounts/${accountSlug}/editor`, {
      headers: authHeaders(token),
    })
    const payload = await readApiPayload(response)

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudo cargar el editor.')
    }

    applyEditorPayload(payload)
    return payload
  }

  useEffect(() => {
    if (!token) {
      return
    }

    window.localStorage.setItem('neurorest-admin-token', token)
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    async function loadAccounts() {
      setStatus('loading-accounts')
      setMessage('')

      try {
        const response = await fetch('/api/admin/accounts', {
          headers: authHeaders(token),
        })
        const payload = await readApiPayload(response)

        if (!response.ok) {
          throw new Error(payload.message ?? 'No se pudieron cargar las cuentas.')
        }

        if (cancelled) {
          return
        }

        setAccounts(payload)
        if (!selectedAccount) {
          setSelectedAccount(payload[0]?.slug ?? '')
        }
        setStatus('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'No se pudieron cargar las cuentas.')
      }
    }

    loadAccounts()

    return () => {
      cancelled = true
    }
  }, [token, selectedAccount])

  useEffect(() => {
    if (!token || !selectedAccount) {
      return
    }

    let cancelled = false

    async function loadEditor() {
      setStatus('loading-editor')
      setMessage('')

      try {
        const response = await fetch(`/api/admin/accounts/${selectedAccount}/editor`, {
          headers: authHeaders(token),
        })
        const payload = await readApiPayload(response)

        if (!response.ok) {
          throw new Error(payload.message ?? 'No se pudo cargar el editor.')
        }

        if (cancelled) {
          return
        }

        applyEditorPayload(payload)
        setStatus('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'No se pudo cargar el editor.')
      }
    }

    loadEditor()

    return () => {
      cancelled = true
    }
  }, [token, selectedAccount])

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ value: account.slug, label: account.name })),
    [accounts],
  )
  const sourceAccountOptions = useMemo(
    () =>
      accounts
        .filter((account) => account.slug !== selectedAccount)
        .map((account) => ({ value: account.slug, label: account.name })),
    [accounts, selectedAccount],
  )

  function updatePresentation(path, value) {
    setPresentation((current) => {
      if (path === 'layout') {
        return applyLayoutSelection(current, value)
      }

      const next = structuredClone(current)
      const parts = path.split('.')
      let target = next

      for (let index = 0; index < parts.length - 1; index += 1) {
        if (!target[parts[index]] || typeof target[parts[index]] !== 'object') {
          target[parts[index]] = {}
        }
        target = target[parts[index]]
      }

      target[parts.at(-1)] = value
      return next
    })
  }

  async function handleCreateAccount(event) {
    event.preventDefault()
    setMessage('')

    const response = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(createForm),
    })
    const payload = await readApiPayload(response)

    if (!response.ok) {
      setMessage(payload.message ?? 'No se pudo crear la cuenta.')
      return
    }

    setAccounts((current) => {
      const next = current.some((account) => account.slug === payload.slug)
        ? current.map((account) => (account.slug === payload.slug ? { ...account, ...payload } : account))
        : [...current, payload]

      return next.sort((a, b) => a.name.localeCompare(b.name))
    })
    setSelectedAccount(payload.slug)
    setMessage(
      payload.linkedExisting
        ? `Cuenta enlazada: ${payload.name}. ${
            payload.copiedProducts ? `Productos copiados: ${payload.copiedProducts}.` : ''
          }`
        : `Cuenta ${payload.demo ? 'demo ' : ''}creada: ${payload.name}. ${
            payload.copiedProducts ? `Productos copiados: ${payload.copiedProducts}.` : ''
          }`,
    )
  }

  async function handleCopyProducts(event) {
    event.preventDefault()

    if (!selectedAccount || !copyForm.sourceAccountId) {
      setMessage('Selecciona un menu origen para copiar productos.')
      return
    }

    if (copyForm.replaceExisting) {
      const confirmed = window.confirm(
        'Esto va a borrar los productos actuales del menu activo y reemplazarlos por los del menu origen. Continuar?',
      )

      if (!confirmed) {
        return
      }
    }

    setStatus('copying-products')
    setMessage('')

    try {
      const response = await fetch(`/api/admin/accounts/${selectedAccount}/products/copy`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(copyForm),
      })
      const payload = await readApiPayload(response)

      if (!response.ok) {
        throw new Error(payload.message ?? 'No se pudieron copiar los productos.')
      }

      await refreshEditor(selectedAccount)
      setMessage(`Productos copiados desde ${payload.source?.name ?? 'el menu origen'}: ${payload.copied}.`)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'No se pudieron copiar los productos.')
    }
  }

  async function handleDeleteSelectedMenu() {
    if (!selectedAccount || !restaurant) {
      return
    }

    const confirmed = window.confirm(
      `Vas a eliminar el menu digital "${restaurant.name}". No se borran productos, pedidos ni datos del restaurante en NeuroRest. Continuar?`,
    )

    if (!confirmed) {
      return
    }

    setStatus('deleting-menu')
    setMessage('')

    try {
      const response = await fetch(`/api/admin/accounts/${selectedAccount}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      const payload = await readApiPayload(response)

      if (!response.ok) {
        throw new Error(payload.message ?? 'No se pudo eliminar el menu.')
      }

      setAccounts((current) => current.filter((account) => account.slug !== selectedAccount))
      setSelectedAccount((current) => {
        const nextAccount = accounts.find((account) => account.slug !== current)
        return nextAccount?.slug ?? ''
      })
      setEditor(null)
      setPresentation(defaultPresentation)
      setMessage(`Menu eliminado: ${payload.name}.`)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'No se pudo eliminar el menu.')
    }
  }

  async function handleSavePresentation() {
    setMessage('')

    const response = await fetch(`/api/admin/accounts/${selectedAccount}/presentation`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(presentation),
    })
    const payload = await readApiPayload(response)

    if (!response.ok) {
      setMessage(payload.message ?? 'No se pudo guardar la presentacion.')
      return
    }

    setMessage('Presentacion guardada.')
    setPresentation((current) => ({
      ...current,
      ...payload,
    }))
  }

  async function handleUploadPresentationAsset(fieldPath, file, kind) {
    if (!file) {
      return
    }

    if (!selectedAccount) {
      setMessage('Selecciona una cuenta antes de subir assets del menu.')
      return
    }

    setMessage(`Preparando subida de ${file.name}...`)

    const signedResponse = await fetch(`/api/admin/accounts/${selectedAccount}/asset-upload-url`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'image/png',
        size: file.size,
        kind,
      }),
    })
    const signedPayload = await readApiPayload(signedResponse)

    if (!signedResponse.ok) {
      setMessage(signedPayload.message ?? 'No se pudo preparar la subida del asset.')
      return
    }

    setMessage(`Subiendo ${file.name} directo a Supabase Storage...`)

    const uploadResponse = await uploadFileToSignedUrl(signedPayload, file)

    if (!uploadResponse.ok) {
      const detail = await uploadResponse.text()
      setMessage(detail || 'No se pudo subir el asset directo a Supabase Storage.')
      return
    }

    updatePresentation(fieldPath, signedPayload.publicUrl)
    setMessage('Asset subido. Guarda la presentacion para aplicar el cambio.')
  }

  async function handleSaveProductVideo(productId, videoUrl) {
    setMessage('')

    const response = await fetch(`/api/admin/products/${productId}/media`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ video_url: videoUrl || null }),
    })
    const payload = await readApiPayload(response)

    if (!response.ok) {
      setMessage(payload.message ?? 'No se pudo guardar el video.')
      return
    }

    setEditor((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? { ...product, video_url: payload.video_url ?? null } : product,
      ),
    }))
    setMessage('Video guardado para el producto.')
  }

  async function handleClearProductVideo(productId) {
    await handleSaveProductVideo(productId, '')
  }

  async function handleSaveProductImage(productId, imageUrl) {
    setMessage('')

    const response = await fetch(`/api/admin/products/${productId}/media`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ image_url: imageUrl || null }),
    })
    const payload = await readApiPayload(response)

    if (!response.ok) {
      setMessage(payload.message ?? 'No se pudo guardar la imagen.')
      return
    }

    setEditor((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? { ...product, image_url: payload.image_url ?? null } : product,
      ),
    }))
    setMessage('Imagen guardada para el producto.')
  }

  async function handleClearProductImage(productId) {
    await handleSaveProductImage(productId, '')
  }

  async function handleUploadProductVideo(productId, file) {
    if (!file) {
      setMessage('Selecciona un archivo .mp4 antes de subirlo.')
      return
    }

    setMessage(`Preparando subida directa para ${file.name}...`)

    const signedResponse = await fetch(`/api/admin/products/${productId}/video-upload-url`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'video/mp4',
        size: file.size,
      }),
    })
    const signedPayload = await readApiPayload(signedResponse)

    if (!signedResponse.ok) {
      setMessage(signedPayload.message ?? 'No se pudo preparar la subida del video.')
      return
    }

    setMessage(`Subiendo ${file.name} directo a Supabase Storage...`)

    const uploadResponse = await uploadFileToSignedUrl(signedPayload, file)

    if (!uploadResponse.ok) {
      const detail = await uploadResponse.text()
      setMessage(detail || 'No se pudo subir el video directo a Supabase Storage.')
      return
    }

    const response = await fetch(`/api/admin/products/${productId}/media`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ video_url: signedPayload.publicUrl }),
    })
    const payload = await readApiPayload(response)

    if (!response.ok) {
      setMessage(payload.message ?? 'El video subio, pero no se pudo vincular al producto.')
      return
    }

    setEditor((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? { ...product, video_url: payload.video_url ?? null } : product,
      ),
    }))
    setMessage('Video subido a Supabase Storage y vinculado al producto.')
  }

  async function handleUploadProductImage(productId, file) {
    if (!file) {
      setMessage('Selecciona una imagen antes de subirla.')
      return
    }

    setMessage(`Subiendo ${file.name}...`)

    const response = await fetch(`/api/admin/products/${productId}/image-upload`, {
      method: 'POST',
      headers: {
        'x-admin-token': token,
        'content-type': file.type || 'image/jpeg',
        'x-file-name': file.name,
      },
      body: await file.arrayBuffer(),
    })
    const payload = await readApiPayload(response)

    if (!response.ok) {
      setMessage(payload.message ?? 'No se pudo subir la imagen al storage.')
      return
    }

    setEditor((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? { ...product, image_url: payload.image_url ?? null } : product,
      ),
    }))
    setMessage('Imagen subida a Supabase Storage y vinculada al producto.')
  }

  return (
    <div className="admin-shell">
      <div className="admin-container">
        <header className="admin-header admin-hero-card">
          <div>
            <span className="admin-kicker">Panel interno</span>
            <h1>NeuroRest Menu Admin</h1>
            <p>Gestiona menus digitales, identidad visual y media de producto desde un solo lugar.</p>
          </div>
          <div className="admin-header-actions">
            <span className={`admin-status-pill ${token ? 'is-ready' : ''}`}>
              {token ? 'Token cargado' : 'Sin token'}
            </span>
            {menuPublicUrl ? (
              <a className="admin-link-button" href={menuPublicUrl} target="_blank" rel="noreferrer">
                Ver menu
              </a>
            ) : null}
          </div>
        </header>

        <section className="admin-card admin-access-card">
          <div className="admin-card-heading">
            <div>
              <h2>Acceso</h2>
              <p>Ingresa el token para cargar y administrar los menus.</p>
            </div>
          </div>

          <div className="admin-token-row">
            <label className="admin-field">
              <span>Token admin</span>
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="NEUROREST_ADMIN_TOKEN"
              />
            </label>
          </div>

          {status.startsWith('loading') ? (
            <p className="admin-message">Sincronizando panel...</p>
          ) : null}
          {message ? <p className="admin-message">{message}</p> : null}
        </section>

        <section className="admin-grid">
          <article className="admin-card admin-create-card">
            <div className="admin-card-heading">
              <div>
                <span className="admin-kicker">Nuevo menu</span>
                <h2>Crear cuenta</h2>
                <p>Crea un menu real por slug o una cuenta demo sin tener que abrirla antes en NeuroRest.</p>
              </div>
            </div>
            <form className="admin-form" onSubmit={handleCreateAccount}>
              <label className="admin-checkbox admin-checkbox-card">
                <input
                  type="checkbox"
                  checked={createForm.demo}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, demo: event.target.checked }))
                  }
                />
                <span>Crear como cuenta demo</span>
              </label>
              <label className="admin-field">
                <span>Nombre</span>
                <input
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="admin-field">
                <span>Slug</span>
                <input
                  value={createForm.slug}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </label>
              <label className="admin-field">
                <span>Ciudad</span>
                <input
                  value={createForm.city}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </label>
              <label className="admin-field">
                <span>Direccion</span>
                <input
                  value={createForm.address}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </label>
              <label className="admin-field">
                <span>Copiar productos desde otro menu</span>
                <select
                  value={createForm.sourceAccountId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      sourceAccountId: event.target.value,
                    }))
                  }
                >
                  <option value="">No copiar productos</option>
                  {accountOptions.map((account) => (
                    <option key={account.value} value={account.value}>
                      {account.label}
                    </option>
                  ))}
                </select>
                <small className="admin-help">
                  Ideal para demos: crea el menu y trae productos, fotos y videos desde un catalogo existente.
                </small>
              </label>
              {createForm.sourceAccountId ? (
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={createForm.replaceProducts}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        replaceProducts: event.target.checked,
                      }))
                    }
                  />
                  <span>Reemplazar productos si el slug ya existia</span>
                </label>
              ) : null}
              <button type="submit" className="admin-primary">
                {createForm.demo ? 'Crear demo' : 'Crear cuenta'}
              </button>
            </form>
          </article>

          <article className="admin-card admin-active-card">
            <div className="admin-card-heading">
              <div>
                <span className="admin-kicker">Edicion actual</span>
                <h2>Cuenta activa</h2>
                <p>Selecciona el menu que quieres configurar.</p>
              </div>
            </div>
            <label className="admin-field">
              <span>Seleccionar cuenta</span>
              <select
                value={selectedAccount}
                onChange={(event) => setSelectedAccount(event.target.value)}
              >
                <option value="">Selecciona una cuenta</option>
                {accountOptions.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </label>

            {restaurant ? (
              <div className="admin-meta">
                <strong>{restaurant.name}</strong>
                <span>{restaurant.slug}</span>
                <span>{restaurant.city || 'Sin ciudad'}</span>
              </div>
            ) : null}

            {restaurant ? (
              <div className="admin-active-actions">
                <a className="admin-link-button" href={menuPublicUrl} target="_blank" rel="noreferrer">
                  Abrir menu publico
                </a>
                <button type="button" className="admin-danger" onClick={handleDeleteSelectedMenu}>
                  Eliminar menu
                </button>
                <p>El menu deja de estar publicado, pero no se borra la cuenta ni sus productos.</p>
              </div>
            ) : null}
          </article>
        </section>

        {selectedAccount && restaurant ? (
          <section className="admin-card admin-copy-card">
            <div className="admin-section-head">
              <div>
                <span className="admin-kicker">Importar catalogo</span>
                <h2>Copiar productos de otro menu</h2>
                <p>Trae productos, categorias, fotos y videos de una cuenta existente al menu activo.</p>
              </div>
            </div>
            <form className="admin-copy-form" onSubmit={handleCopyProducts}>
              <label className="admin-field">
                <span>Menu origen</span>
                <select
                  value={copyForm.sourceAccountId}
                  onChange={(event) =>
                    setCopyForm((current) => ({
                      ...current,
                      sourceAccountId: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecciona un menu para copiar</option>
                  {sourceAccountOptions.map((account) => (
                    <option key={account.value} value={account.value}>
                      {account.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={copyForm.replaceExisting}
                  onChange={(event) =>
                    setCopyForm((current) => ({
                      ...current,
                      replaceExisting: event.target.checked,
                    }))
                  }
                />
                <span>Reemplazar productos actuales</span>
              </label>
              <button
                type="submit"
                className="admin-primary"
                disabled={!copyForm.sourceAccountId || status === 'copying-products'}
              >
                {status === 'copying-products' ? 'Copiando...' : 'Copiar productos'}
              </button>
            </form>
          </section>
        ) : null}

        {selectedAccount ? (
          <>
            <section className="admin-card">
              <div className="admin-section-head">
                <div>
                  <span className="admin-kicker">Look & feel</span>
                  <h2>Presentacion</h2>
                  <p>Define el diseño visual que va a ver el cliente en el menu.</p>
                </div>
                <button type="button" className="admin-primary" onClick={handleSavePresentation}>
                  Guardar presentacion
                </button>
              </div>

              <div className="admin-form admin-form-grid">
                <label className="admin-field">
                  <span>Diseno del menu</span>
                  <select
                    value={presentation.layout}
                    onChange={(event) => updatePresentation('layout', event.target.value)}
                  >
                    <option value="editorial">Clasico editorial</option>
                    <option value="bistro">Bistro moderno</option>
                    <option value="luxe">Premium oscuro</option>
                    <option value="gelato">Heladeria</option>
                    <option value="pizzeria">Pizzeria</option>
                    <option value="burger">Burger</option>
                    <option value="blue-burger">Burger azul</option>
                    <option value="host">Host crispy</option>
                    <option value="kika">Kika cafe</option>
                    <option value="florian">Florian cafe</option>
                  </select>
                  <small className="admin-help">{layoutDescriptions[presentation.layout]}</small>
                </label>

                <label className="admin-field">
                  <span>Tarjetas de productos</span>
                  <select
                    value={presentation.cards.style}
                    onChange={(event) => updatePresentation('cards.style', event.target.value)}
                  >
                    <option value="editorial-list">Lista simple</option>
                    <option value="magazine-list">Visual tipo revista</option>
                    <option value="glass-list">Premium con efecto vidrio</option>
                    <option value="gelato-cards">Heladeria</option>
                    <option value="pizzeria-grid">Pizzeria dos columnas</option>
                    <option value="burger-grid">Burger oscuro</option>
                    <option value="blue-burger-list">Burger azul horizontal</option>
                    <option value="host-grid">Host crispy</option>
                    <option value="kika-cards">Kika cafe</option>
                    <option value="florian-list">Florian cafe</option>
                  </select>
                  <small className="admin-help">
                    {cardStyleDescriptions[presentation.cards.style]}
                  </small>
                </label>

                <label className="admin-field">
                  <span>Foto/video en productos</span>
                  <select
                    value={presentation.preview.productMedia}
                    onChange={(event) =>
                      updatePresentation('preview.productMedia', event.target.value)
                    }
                  >
                    <option value="image-only">Solo fotos</option>
                    <option value="image-with-video-chip">Foto principal + etiqueta de video</option>
                    <option value="video-first">Video como vista principal</option>
                  </select>
                  <small className="admin-help">
                    {previewDescriptions[presentation.preview.productMedia]}
                  </small>
                </label>

                <label className="admin-field">
                  <span>Nombre visible / logo textual</span>
                  <input
                    value={presentation.branding.wordmark}
                    onChange={(event) =>
                      updatePresentation('branding.wordmark', event.target.value)
                    }
                  />
                  <small className="admin-help">
                    Texto principal de marca. Ejemplo: La Buona, Dolce o Sandra's Rose.
                  </small>
                </label>

                <label className="admin-field">
                  <span>Subtitulo del logo</span>
                  <input
                    value={presentation.branding.subtitle}
                    onChange={(event) =>
                      updatePresentation('branding.subtitle', event.target.value)
                    }
                  />
                  <small className="admin-help">Texto pequeno debajo del nombre, como Pizzeria o Cocina de autor.</small>
                </label>

                <label className="admin-field">
                  <span>Imagen principal</span>
                  <input
                    value={presentation.hero.image}
                    onChange={(event) => updatePresentation('hero.image', event.target.value)}
                  />
                  <small className="admin-help">URL de la imagen grande de portada del menu.</small>
                  <span className="admin-upload admin-inline-upload">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                      onChange={(event) =>
                        handleUploadPresentationAsset(
                          'hero.image',
                          event.target.files?.[0],
                          'header',
                        )
                      }
                    />
                    <span>Subir imagen header</span>
                  </span>
                </label>

                <label className="admin-field">
                  <span>Video header</span>
                  <input
                    value={presentation.hero.video ?? ''}
                    onChange={(event) => updatePresentation('hero.video', event.target.value)}
                    placeholder="https://.../header.mp4"
                  />
                  <small className="admin-help">
                    Opcional: si cargas un video, se reproduce en el header. La imagen queda como respaldo.
                  </small>
                  <span className="admin-upload admin-inline-upload">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(event) =>
                        handleUploadPresentationAsset(
                          'hero.video',
                          event.target.files?.[0],
                          'header-video',
                        )
                      }
                    />
                    <span>Subir video header</span>
                  </span>
                </label>

                <label className="admin-field">
                  <span>Logo / marca superior</span>
                  <input
                    value={presentation.theme.logoImage}
                    onChange={(event) => updatePresentation('theme.logoImage', event.target.value)}
                    placeholder="/gelato/logo-dolce.png"
                  />
                  <small className="admin-help">
                    Opcional: reemplaza el logo visual en disenos que usan imagen de marca.
                  </small>
                  <span className="admin-upload admin-inline-upload">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                      onChange={(event) =>
                        handleUploadPresentationAsset(
                          'theme.logoImage',
                          event.target.files?.[0],
                          'logo',
                        )
                      }
                    />
                    <span>Subir logo</span>
                  </span>
                </label>

                <label className="admin-field">
                  <span>Ajuste de imagen header</span>
                  <select
                    value={presentation.theme.headerObjectFit}
                    onChange={(event) =>
                      updatePresentation('theme.headerObjectFit', event.target.value)
                    }
                  >
                    <option value="">Default</option>
                    <option value="contain">Ver imagen completa</option>
                    <option value="cover">Cubrir header</option>
                    <option value="fill">Estirar</option>
                  </select>
                  <small className="admin-help">Controla como encaja la imagen del header.</small>
                </label>

                {headerTextFields ? (
                  <>
                    {headerTextFields.title ? (
                      <label className="admin-field">
                        <span>{headerTextFields.title[0]}</span>
                        <input
                          value={presentation.hero.title}
                          onChange={(event) =>
                            updatePresentation('hero.title', event.target.value)
                          }
                        />
                        <small className="admin-help">{headerTextFields.title[1]}</small>
                      </label>
                    ) : null}

                    {headerTextFields.accent ? (
                      <label className="admin-field">
                        <span>{headerTextFields.accent[0]}</span>
                        <input
                          value={presentation.hero.accent}
                          onChange={(event) =>
                            updatePresentation('hero.accent', event.target.value)
                          }
                        />
                        <small className="admin-help">{headerTextFields.accent[1]}</small>
                      </label>
                    ) : null}

                    {headerTextFields.description ? (
                      <label className="admin-field admin-field-wide">
                        <span>{headerTextFields.description[0]}</span>
                        <textarea
                          rows="3"
                          value={presentation.hero.description}
                          onChange={(event) =>
                            updatePresentation('hero.description', event.target.value)
                          }
                        />
                        <small className="admin-help">{headerTextFields.description[1]}</small>
                      </label>
                    ) : null}
                  </>
                ) : (
                  <div className="admin-field admin-field-wide admin-context-note">
                    <span>Textos del header no visibles</span>
                    <small className="admin-help">
                      Este diseno usa una imagen completa como header. El titulo, destacado y
                      descripcion no aparecen en el menu; cambia esos textos editando la imagen
                      principal.
                    </small>
                  </div>
                )}

                <label className="admin-field">
                  <span>Fondo general</span>
                  <input
                    value={presentation.theme.background}
                    onChange={(event) => updatePresentation('theme.background', event.target.value)}
                    placeholder="#f4efe6"
                  />
                  <small className="admin-help">Color base del menu completo.</small>
                </label>

                <label className="admin-field">
                  <span>Fondo avanzado</span>
                  <input
                    value={presentation.theme.pageBackground}
                    onChange={(event) =>
                      updatePresentation('theme.pageBackground', event.target.value)
                    }
                    placeholder="linear-gradient(...)"
                  />
                  <small className="admin-help">Opcional: color, gradient o imagen CSS para todo el fondo.</small>
                </label>

                <label className="admin-field">
                  <span>Fondo del header</span>
                  <input
                    value={presentation.theme.heroBackground}
                    onChange={(event) =>
                      updatePresentation('theme.heroBackground', event.target.value)
                    }
                    placeholder="#ffffff o linear-gradient(...)"
                  />
                  <small className="admin-help">Fondo detras de la imagen principal.</small>
                </label>

                <label className="admin-field">
                  <span>Alto minimo header</span>
                  <input
                    value={presentation.theme.heroMinHeight}
                    onChange={(event) =>
                      updatePresentation('theme.heroMinHeight', event.target.value)
                    }
                    placeholder="22rem"
                  />
                  <small className="admin-help">Ejemplo: 18rem, 320px o deja vacio para default.</small>
                </label>

                <label className="admin-field">
                  <span>Borde redondeado header</span>
                  <input
                    value={presentation.theme.heroRadius}
                    onChange={(event) => updatePresentation('theme.heroRadius', event.target.value)}
                    placeholder="0 0 2rem 2rem"
                  />
                  <small className="admin-help">Controla las esquinas del bloque superior.</small>
                </label>

                <label className="admin-field">
                  <span>Fondo del contenido</span>
                  <input
                    value={presentation.theme.contentBackground}
                    onChange={(event) =>
                      updatePresentation('theme.contentBackground', event.target.value)
                    }
                    placeholder="#fffdfa"
                  />
                  <small className="admin-help">Fondo del area donde viven categorias y productos.</small>
                </label>

                <label className="admin-field">
                  <span>Color superficie</span>
                  <input
                    value={presentation.theme.surface}
                    onChange={(event) => updatePresentation('theme.surface', event.target.value)}
                    placeholder="#fffdfa"
                  />
                  <small className="admin-help">Color de paneles principales.</small>
                </label>

                <label className="admin-field">
                  <span>Color superficie secundaria</span>
                  <input
                    value={presentation.theme.surfaceAlt}
                    onChange={(event) => updatePresentation('theme.surfaceAlt', event.target.value)}
                    placeholder="#f8f4ec"
                  />
                  <small className="admin-help">Color de fondos suaves y estados secundarios.</small>
                </label>

                <label className="admin-field">
                  <span>Color texto</span>
                  <input
                    value={presentation.theme.text}
                    onChange={(event) => updatePresentation('theme.text', event.target.value)}
                    placeholder="#1b1b18"
                  />
                  <small className="admin-help">Color de titulos y textos principales.</small>
                </label>

                <label className="admin-field">
                  <span>Color texto secundario</span>
                  <input
                    value={presentation.theme.muted}
                    onChange={(event) => updatePresentation('theme.muted', event.target.value)}
                    placeholder="rgba(27, 27, 24, 0.72)"
                  />
                  <small className="admin-help">Color de descripciones y ayudas.</small>
                </label>

                <label className="admin-field">
                  <span>Color principal</span>
                  <input
                    value={presentation.theme.primary}
                    onChange={(event) => updatePresentation('theme.primary', event.target.value)}
                  />
                  <small className="admin-help">Color de botones, detalles activos y acentos importantes.</small>
                </label>

                <label className="admin-field">
                  <span>Texto sobre color principal</span>
                  <input
                    value={presentation.theme.primaryText}
                    onChange={(event) =>
                      updatePresentation('theme.primaryText', event.target.value)
                    }
                    placeholder="#fffdf8"
                  />
                  <small className="admin-help">Color del texto sobre botones activos.</small>
                </label>

                <label className="admin-field">
                  <span>Color secundario</span>
                  <input
                    value={presentation.theme.accent}
                    onChange={(event) => updatePresentation('theme.accent', event.target.value)}
                  />
                  <small className="admin-help">Color de apoyo para detalles visuales.</small>
                </label>

                <label className="admin-field">
                  <span>Bordes</span>
                  <input
                    value={presentation.theme.border}
                    onChange={(event) => updatePresentation('theme.border', event.target.value)}
                    placeholder="rgba(96, 91, 74, 0.12)"
                  />
                  <small className="admin-help">Color de lineas y contornos.</small>
                </label>

                <label className="admin-field">
                  <span>Sombras</span>
                  <input
                    value={presentation.theme.shadow}
                    onChange={(event) => updatePresentation('theme.shadow', event.target.value)}
                    placeholder="rgba(45, 38, 24, 0.08)"
                  />
                  <small className="admin-help">Color base para sombras.</small>
                </label>

                <label className="admin-field">
                  <span>Fuente de titulos</span>
                  <input
                    value={presentation.theme.displayFont}
                    onChange={(event) =>
                      updatePresentation('theme.displayFont', event.target.value)
                    }
                  />
                  <small className="admin-help">Tipografia usada en titulos grandes y marca.</small>
                </label>

                <label className="admin-field">
                  <span>Fuente de textos</span>
                  <input
                    value={presentation.theme.bodyFont}
                    onChange={(event) =>
                      updatePresentation('theme.bodyFont', event.target.value)
                    }
                  />
                  <small className="admin-help">Tipografia usada en descripciones, precios y formularios.</small>
                </label>

                <label className="admin-field">
                  <span>Fondo barra categorias</span>
                  <input
                    value={presentation.theme.categoryBackground}
                    onChange={(event) =>
                      updatePresentation('theme.categoryBackground', event.target.value)
                    }
                    placeholder="#ffffff"
                  />
                  <small className="admin-help">Fondo de botones o chips de categorias.</small>
                </label>

                <label className="admin-field">
                  <span>Categoria activa</span>
                  <input
                    value={presentation.theme.categoryActiveBackground}
                    onChange={(event) =>
                      updatePresentation('theme.categoryActiveBackground', event.target.value)
                    }
                    placeholder="#445d39"
                  />
                  <small className="admin-help">Color del chip seleccionado.</small>
                </label>

                <label className="admin-field">
                  <span>Texto categorias</span>
                  <input
                    value={presentation.theme.categoryText}
                    onChange={(event) =>
                      updatePresentation('theme.categoryText', event.target.value)
                    }
                    placeholder="#4f6546"
                  />
                  <small className="admin-help">Color de categorias no seleccionadas.</small>
                </label>

                <label className="admin-field">
                  <span>Texto categoria activa</span>
                  <input
                    value={presentation.theme.categoryActiveText}
                    onChange={(event) =>
                      updatePresentation('theme.categoryActiveText', event.target.value)
                    }
                    placeholder="#ffffff"
                  />
                  <small className="admin-help">Texto/iconos dentro de la categoria activa.</small>
                </label>

                <label className="admin-field">
                  <span>Borde categorias</span>
                  <input
                    value={presentation.theme.categoryBorder}
                    onChange={(event) =>
                      updatePresentation('theme.categoryBorder', event.target.value)
                    }
                    placeholder="rgba(0,0,0,.12)"
                  />
                  <small className="admin-help">Contorno de los chips de categoria.</small>
                </label>

                <label className="admin-field">
                  <span>Radio categorias</span>
                  <input
                    value={presentation.theme.categoryRadius}
                    onChange={(event) =>
                      updatePresentation('theme.categoryRadius', event.target.value)
                    }
                    placeholder="999px"
                  />
                  <small className="admin-help">Redondeado de la barra: 1rem, 999px, etc.</small>
                </label>

                <label className="admin-field">
                  <span>Fondo cards productos</span>
                  <input
                    value={presentation.theme.cardBackground}
                    onChange={(event) =>
                      updatePresentation('theme.cardBackground', event.target.value)
                    }
                    placeholder="#fffdfa"
                  />
                  <small className="admin-help">Color o gradient de las cards.</small>
                </label>

                <label className="admin-field">
                  <span>Texto cards</span>
                  <input
                    value={presentation.theme.cardText}
                    onChange={(event) => updatePresentation('theme.cardText', event.target.value)}
                    placeholder="#1b1b18"
                  />
                  <small className="admin-help">Color de nombres de productos.</small>
                </label>

                <label className="admin-field">
                  <span>Descripcion cards</span>
                  <input
                    value={presentation.theme.cardMuted}
                    onChange={(event) => updatePresentation('theme.cardMuted', event.target.value)}
                    placeholder="rgba(27,27,24,.72)"
                  />
                  <small className="admin-help">Color de descripciones dentro de cards.</small>
                </label>

                <label className="admin-field">
                  <span>Precio cards</span>
                  <input
                    value={presentation.theme.cardPrice}
                    onChange={(event) => updatePresentation('theme.cardPrice', event.target.value)}
                    placeholder="#445d39"
                  />
                  <small className="admin-help">Color del precio.</small>
                </label>

                <label className="admin-field">
                  <span>Borde cards</span>
                  <input
                    value={presentation.theme.cardBorder}
                    onChange={(event) => updatePresentation('theme.cardBorder', event.target.value)}
                    placeholder="rgba(0,0,0,.12)"
                  />
                  <small className="admin-help">Contorno de las cards de productos.</small>
                </label>

                <label className="admin-field">
                  <span>Radio cards</span>
                  <input
                    value={presentation.theme.cardRadius}
                    onChange={(event) => updatePresentation('theme.cardRadius', event.target.value)}
                    placeholder="1.5rem"
                  />
                  <small className="admin-help">Redondeado de productos.</small>
                </label>

                <label className="admin-field">
                  <span>Sombra cards</span>
                  <input
                    value={presentation.theme.cardShadow}
                    onChange={(event) => updatePresentation('theme.cardShadow', event.target.value)}
                    placeholder="0 12px 24px rgba(0,0,0,.12)"
                  />
                  <small className="admin-help">Sombra CSS completa para cards.</small>
                </label>

                <label className="admin-field">
                  <span>Alto imagen producto</span>
                  <input
                    value={presentation.theme.productImageHeight}
                    onChange={(event) =>
                      updatePresentation('theme.productImageHeight', event.target.value)
                    }
                    placeholder="10rem"
                  />
                  <small className="admin-help">Ejemplo: 8rem, 160px, 40vw.</small>
                </label>

                <label className="admin-field">
                  <span>Boton agregar</span>
                  <input
                    value={presentation.theme.addButtonBackground}
                    onChange={(event) =>
                      updatePresentation('theme.addButtonBackground', event.target.value)
                    }
                    placeholder="#445d39"
                  />
                  <small className="admin-help">Color del boton + en productos.</small>
                </label>

                <label className="admin-field">
                  <span>Texto boton agregar</span>
                  <input
                    value={presentation.theme.addButtonText}
                    onChange={(event) =>
                      updatePresentation('theme.addButtonText', event.target.value)
                    }
                    placeholder="#ffffff"
                  />
                  <small className="admin-help">Color del icono +.</small>
                </label>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={presentation.preview.autoplayVideos}
                    onChange={(event) =>
                      updatePresentation('preview.autoplayVideos', event.target.checked)
                    }
                  />
                  <span>Reproducir videos automaticamente</span>
                </label>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={presentation.preview.mutedVideos}
                    onChange={(event) =>
                      updatePresentation('preview.mutedVideos', event.target.checked)
                    }
                  />
                  <span>Videos en mute</span>
                </label>
              </div>
            </section>

            <section className="admin-card">
              <div className="admin-section-head">
                <div>
                  <span className="admin-kicker">Catalogo visual</span>
                  <h2>Fotos y videos por producto</h2>
                  <p>Carga una foto fija o un video corto para cada producto del menu.</p>
                </div>
                <div className="admin-stat-row">
                  <span>{productStats.total} productos</span>
                  <span>{productStats.withImage} fotos</span>
                  <span>{productStats.withVideo} videos</span>
                </div>
              </div>
              <div className="admin-products">
                {products.map((product) => (
                  <ProductMediaRow
                    key={`${product.id}:${product.image_url ?? ''}:${product.video_url ?? ''}`}
                    product={product}
                    onClearImage={handleClearProductImage}
                    onClearVideo={handleClearProductVideo}
                    onSaveImage={handleSaveProductImage}
                    onSaveVideo={handleSaveProductVideo}
                    onUploadImage={handleUploadProductImage}
                    onUploadVideo={handleUploadProductVideo}
                  />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}

function ProductMediaRow({
  product,
  onClearImage,
  onClearVideo,
  onSaveImage,
  onSaveVideo,
  onUploadImage,
  onUploadVideo,
}) {
  const [imageUrl, setImageUrl] = useState(product.image_url ?? '')
  const [videoUrl, setVideoUrl] = useState(product.video_url ?? '')
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const previewImage = imageUrl || product.image_url
  const hasImageDraft = Boolean(imageFile || imageUrl.trim())
  const hasVideoDraft = Boolean(videoFile || videoUrl.trim())

  function handleImageAction() {
    if (imageFile) {
      onUploadImage(product.id, imageFile)
      return
    }

    onSaveImage(product.id, imageUrl)
  }

  function handleVideoAction() {
    if (videoFile) {
      onUploadVideo(product.id, videoFile)
      return
    }

    onSaveVideo(product.id, videoUrl)
  }

  return (
    <div className="admin-product-row">
      <div className="admin-product-info">
        <div className="admin-product-thumb">
          {previewImage ? <img src={previewImage} alt="" /> : <span>Sin foto</span>}
          {videoUrl ? <small>Video</small> : null}
        </div>
        <div className="admin-product-copy">
          <strong>{product.name}</strong>
          <span>{product.category || 'Sin categoria'}</span>
        </div>
      </div>

      <div className="admin-product-media-fields">
        <label className="admin-media-field">
          <span>Foto</span>
          <input
            className="admin-product-input"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://.../foto.webp"
          />
        </label>

        <label className="admin-media-field">
          <span>Video</span>
          <input
            className="admin-product-input"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://.../preview.mp4"
          />
        </label>
      </div>

      <div className="admin-product-actions">
        <div className="admin-media-actions">
          <label className="admin-upload">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
            <span>{imageFile ? imageFile.name : 'Elegir foto'}</span>
          </label>

          <button
            type="button"
            className="admin-primary"
            disabled={!hasImageDraft}
            onClick={handleImageAction}
          >
            {imageFile ? 'Subir foto' : 'Guardar URL foto'}
          </button>

          {previewImage ? (
            <button type="button" className="admin-danger" onClick={() => onClearImage(product.id)}>
              Quitar foto
            </button>
          ) : null}
        </div>

        <div className="admin-media-actions">
          <label className="admin-upload">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
            />
            <span>{videoFile ? videoFile.name : 'Elegir video'}</span>
          </label>

          <button
            type="button"
            className="admin-primary"
            disabled={!hasVideoDraft}
            onClick={handleVideoAction}
          >
            {videoFile ? 'Subir video' : 'Guardar URL video'}
          </button>

          {videoUrl ? (
            <button type="button" className="admin-danger" onClick={() => onClearVideo(product.id)}>
              Quitar video
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

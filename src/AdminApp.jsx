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
  },
  hero: {
    image: '/dishes/hero-clean-cut.png',
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

const layoutDescriptions = {
  editorial: 'Diseno clasico y elegante: portada, categorias y productos en una lista limpia.',
  bistro: 'Diseno mas visual: una carta moderna con imagenes destacadas y ritmo tipo revista.',
  luxe: 'Diseno premium: mas dramatico y sofisticado, pensado para marcas gastronomicas elegantes.',
}

const cardStyleDescriptions = {
  'editorial-list': 'Productos en lista, facil de leer y rapido para pedir.',
  'magazine-list': 'Cards mas visuales, con mas protagonismo para fotos y platos destacados.',
  'glass-list': 'Cards con efecto premium/translucido para menus mas atmosfericos.',
}

const previewDescriptions = {
  'image-with-video-chip': 'La foto queda como vista principal y se muestra una etiqueta si el producto tiene video.',
  'video-first': 'El video se usa como vista principal si el producto no tiene una foto subida.',
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
  })

  const products = useMemo(() => editor?.products ?? [], [editor])
  const restaurant = editor?.restaurant ?? null
  const menuPublicUrl = selectedAccount ? `${window.location.origin}/${selectedAccount}` : ''
  const productStats = useMemo(
    () => ({
      total: products.length,
      withImage: products.filter((product) => product.image_url).length,
      withVideo: products.filter((product) => product.video_url).length,
    }),
    [products],
  )

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

  function updatePresentation(path, value) {
    setPresentation((current) => {
      const next = structuredClone(current)
      const parts = path.split('.')
      let target = next

      for (let index = 0; index < parts.length - 1; index += 1) {
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
        ? `Cuenta enlazada a NeuroRest: ${payload.name}. Se mostraran sus productos cargados.`
        : `Cuenta creada: ${payload.name}`,
    )
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
                <p>Usa el mismo slug del restaurante para traer sus productos de NeuroRest.</p>
              </div>
            </div>
            <form className="admin-form" onSubmit={handleCreateAccount}>
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
              <button type="submit" className="admin-primary">
                Crear cuenta
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
                </label>

                <label className="admin-field">
                  <span>Titulo principal</span>
                  <input
                    value={presentation.hero.title}
                    onChange={(event) => updatePresentation('hero.title', event.target.value)}
                  />
                  <small className="admin-help">Frase grande de la portada.</small>
                </label>

                <label className="admin-field">
                  <span>Texto destacado</span>
                  <input
                    value={presentation.hero.accent}
                    onChange={(event) => updatePresentation('hero.accent', event.target.value)}
                  />
                  <small className="admin-help">Parte secundaria o resaltada del titulo.</small>
                </label>

                <label className="admin-field admin-field-wide">
                  <span>Descripcion principal</span>
                  <textarea
                    rows="3"
                    value={presentation.hero.description}
                    onChange={(event) =>
                      updatePresentation('hero.description', event.target.value)
                    }
                  />
                  <small className="admin-help">Texto corto que aparece en la portada del menu.</small>
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
                  <span>Color secundario</span>
                  <input
                    value={presentation.theme.accent}
                    onChange={(event) => updatePresentation('theme.accent', event.target.value)}
                  />
                  <small className="admin-help">Color de apoyo para detalles visuales.</small>
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

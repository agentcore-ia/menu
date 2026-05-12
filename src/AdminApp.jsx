import { useEffect, useMemo, useState } from 'react'
import './App.css'

const defaultPresentation = {
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

  const products = editor?.products ?? []
  const restaurant = editor?.restaurant ?? null

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
        const payload = await response.json()

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
        const payload = await response.json()

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
    const payload = await response.json()

    if (!response.ok) {
      setMessage(payload.message ?? 'No se pudo crear la cuenta.')
      return
    }

    setAccounts((current) => [...current, payload].sort((a, b) => a.name.localeCompare(b.name)))
    setSelectedAccount(payload.slug)
    setMessage(`Cuenta creada: ${payload.name}`)
  }

  async function handleSavePresentation() {
    setMessage('')

    const response = await fetch(`/api/admin/accounts/${selectedAccount}/presentation`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(presentation),
    })
    const payload = await response.json()

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
    const payload = await response.json()

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

  return (
    <div className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1>NeuroRest Menu Admin</h1>
            <p>Gestiona cuentas, identidad visual y previews de video.</p>
          </div>
        </header>

        <section className="admin-card">
          <label className="admin-field">
            <span>Token admin</span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="NEUROREST_ADMIN_TOKEN"
            />
          </label>

          {status.startsWith('loading') ? (
            <p className="admin-message">Sincronizando panel...</p>
          ) : null}
          {message ? <p className="admin-message">{message}</p> : null}
        </section>

        <section className="admin-grid">
          <article className="admin-card">
            <h2>Crear cuenta</h2>
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

          <article className="admin-card">
            <h2>Cuenta activa</h2>
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
          </article>
        </section>

        {selectedAccount ? (
          <>
            <section className="admin-card">
              <div className="admin-section-head">
                <h2>Presentacion</h2>
                <button type="button" className="admin-primary" onClick={handleSavePresentation}>
                  Guardar presentacion
                </button>
              </div>

              <div className="admin-form admin-form-grid">
                <label className="admin-field">
                  <span>Layout</span>
                  <select
                    value={presentation.layout}
                    onChange={(event) => updatePresentation('layout', event.target.value)}
                  >
                    <option value="editorial">editorial</option>
                    <option value="bistro">bistro</option>
                    <option value="luxe">luxe</option>
                  </select>
                </label>

                <label className="admin-field">
                  <span>Cards</span>
                  <select
                    value={presentation.cards.style}
                    onChange={(event) => updatePresentation('cards.style', event.target.value)}
                  >
                    <option value="editorial-list">editorial-list</option>
                    <option value="magazine-list">magazine-list</option>
                    <option value="glass-list">glass-list</option>
                  </select>
                </label>

                <label className="admin-field">
                  <span>Preview</span>
                  <select
                    value={presentation.preview.productMedia}
                    onChange={(event) =>
                      updatePresentation('preview.productMedia', event.target.value)
                    }
                  >
                    <option value="image-with-video-chip">image-with-video-chip</option>
                    <option value="video-first">video-first</option>
                  </select>
                </label>

                <label className="admin-field">
                  <span>Wordmark</span>
                  <input
                    value={presentation.branding.wordmark}
                    onChange={(event) =>
                      updatePresentation('branding.wordmark', event.target.value)
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Subtitle</span>
                  <input
                    value={presentation.branding.subtitle}
                    onChange={(event) =>
                      updatePresentation('branding.subtitle', event.target.value)
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Hero image</span>
                  <input
                    value={presentation.hero.image}
                    onChange={(event) => updatePresentation('hero.image', event.target.value)}
                  />
                </label>

                <label className="admin-field">
                  <span>Hero title</span>
                  <input
                    value={presentation.hero.title}
                    onChange={(event) => updatePresentation('hero.title', event.target.value)}
                  />
                </label>

                <label className="admin-field">
                  <span>Hero accent</span>
                  <input
                    value={presentation.hero.accent}
                    onChange={(event) => updatePresentation('hero.accent', event.target.value)}
                  />
                </label>

                <label className="admin-field admin-field-wide">
                  <span>Hero description</span>
                  <textarea
                    rows="3"
                    value={presentation.hero.description}
                    onChange={(event) =>
                      updatePresentation('hero.description', event.target.value)
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Primary</span>
                  <input
                    value={presentation.theme.primary}
                    onChange={(event) => updatePresentation('theme.primary', event.target.value)}
                  />
                </label>

                <label className="admin-field">
                  <span>Accent</span>
                  <input
                    value={presentation.theme.accent}
                    onChange={(event) => updatePresentation('theme.accent', event.target.value)}
                  />
                </label>

                <label className="admin-field">
                  <span>Display font</span>
                  <input
                    value={presentation.theme.displayFont}
                    onChange={(event) =>
                      updatePresentation('theme.displayFont', event.target.value)
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Body font</span>
                  <input
                    value={presentation.theme.bodyFont}
                    onChange={(event) =>
                      updatePresentation('theme.bodyFont', event.target.value)
                    }
                  />
                </label>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={presentation.preview.autoplayVideos}
                    onChange={(event) =>
                      updatePresentation('preview.autoplayVideos', event.target.checked)
                    }
                  />
                  <span>Autoplay videos</span>
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
              <h2>Videos por producto</h2>
              <div className="admin-products">
                {products.map((product) => (
                  <ProductMediaRow
                    key={`${product.id}:${product.video_url ?? ''}`}
                    product={product}
                    onSave={handleSaveProductVideo}
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

function ProductMediaRow({ product, onSave }) {
  const [videoUrl, setVideoUrl] = useState(product.video_url ?? '')

  return (
    <div className="admin-product-row">
      <div className="admin-product-info">
        <strong>{product.name}</strong>
        <span>{product.category || 'Sin categoria'}</span>
      </div>

      <input
        className="admin-product-input"
        value={videoUrl}
        onChange={(event) => setVideoUrl(event.target.value)}
        placeholder="https://.../preview.mp4"
      />

      <button type="button" className="admin-secondary" onClick={() => onSave(product.id, videoUrl)}>
        Guardar video
      </button>
    </div>
  )
}

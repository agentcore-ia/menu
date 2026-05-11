import { useEffect, useMemo, useState } from 'react'
import './App.css'

const emptyCategories = []

function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 5c-6 0-11 4.3-11 10 0 2.2.7 3.5 2.2 4.7 1.1-3.3 3.2-5.7 6.5-7.2-2 1.6-3.5 3.8-4.3 6.6 5.1.4 8.6-2.9 8.6-8.3V5z" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6l10 6-10 6z" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function getInitialAccountId() {
  const pathAccount = window.location.pathname
    .split('/')
    .filter(Boolean)
    .at(0)

  if (pathAccount) {
    return decodeURIComponent(pathAccount)
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('account') ?? 'sandras-rose'
}

function App() {
  const [accountId] = useState(getInitialAccountId)
  const [menu, setMenu] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDish, setSelectedDish] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadMenu() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const response = await fetch(`/api/accounts/${accountId}/menu`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message ?? 'No se pudo cargar el menu.')
        }

        if (cancelled) {
          return
        }

        setMenu(payload)
        setSelectedCategory(payload.categories[0]?.id ?? '')
        setStatus('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo cargar el menu.',
        )
      }
    }

    loadMenu()

    return () => {
      cancelled = true
    }
  }, [accountId])

  const categories = menu?.categories ?? emptyCategories

  const filteredItems = useMemo(() => {
    const category = categories.find((item) => item.id === selectedCategory)
    return category?.items ?? []
  }, [categories, selectedCategory])

  return (
    <>
      <div className="app-shell">
        <header className="hero-panel">
          <nav className="topbar">
            <div className="brand-lockup">
              <span className="brand-script">{menu?.accountName ?? 'NeuroRest'}</span>
            </div>

            <div className="topbar-actions">
              <button type="button" className="ghost-pill">
                {menu?.currency ?? 'USD'}
              </button>
              <button type="button" className="ghost-pill">
                {(menu?.locale ?? 'es').toUpperCase()}
              </button>
              <button type="button" className="ghost-icon" aria-label="Configuracion">
                <span />
                <span />
                <span />
              </button>
            </div>
          </nav>
        </header>

        <main className="menu-layout">
          <section className="tabs-panel glass-card">
            <div className="tabs-row">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`tab-pill ${
                    selectedCategory === category.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </section>

          {status === 'loading' ? (
            <section className="state-card glass-card">
              <p>Cargando menu digital...</p>
            </section>
          ) : null}

          {status === 'error' ? (
            <section className="state-card glass-card">
              <p>{errorMessage}</p>
              <code>/sandras-rose</code>
            </section>
          ) : null}

          {status === 'ready' ? (
            <section className="items-section">
              <div className="items-grid">
                {filteredItems.map((item) => (
                  <article key={item.id} className="dish-card glass-card">
                    <div className="media-wrap">
                      <img className="dish-media" src={item.image} alt={item.name} />

                      <div className="media-top">
                        <div className="badge-cluster">
                          {item.badge ? (
                            <span className="media-badge">{item.badge}</span>
                          ) : null}
                          {item.dietary.slice(0, 3).map((tag) => (
                            <span key={tag} className="dietary-dot">
                              {tag === 'vegetarian' ? (
                                <IconSpark />
                              ) : tag === 'vegan' ? (
                                <IconLeaf />
                              ) : (
                                <IconGrid />
                              )}
                            </span>
                          ))}
                        </div>
                        {item.video ? (
                          <button
                            type="button"
                            className="round-action"
                            onClick={() => setSelectedDish(item)}
                            aria-label={`Ver video de ${item.name}`}
                          >
                            <IconPlay />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="round-action"
                            onClick={() => setSelectedDish(item)}
                            aria-label={`Ver detalle de ${item.name}`}
                          >
                            <IconPlus />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="dish-content">
                      <button
                        type="button"
                        className="dish-caption"
                        onClick={() => setSelectedDish(item)}
                      >
                        <h3>{item.name}</h3>
                        <strong>{item.price}</strong>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {selectedDish ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedDish(null)}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dish-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedDish(null)}
              aria-label="Cerrar"
            >
              <IconClose />
            </button>

            <div className="modal-media">
              {selectedDish.video ? (
                <video
                  src={selectedDish.video}
                  poster={selectedDish.image}
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <img src={selectedDish.image} alt={selectedDish.name} />
              )}
            </div>

            <div className="modal-copy">
              <p className="eyebrow">{menu?.accountName ?? 'NeuroRest'}</p>
              <h3 id="dish-title">{selectedDish.name}</h3>
              <p>{selectedDish.description}</p>
              <div className="modal-meta">
                <span>{selectedDish.price}</span>
                <span>
                  {selectedDish.video ? 'Incluye video corto' : 'Imagen premium'}
                </span>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

export default App
